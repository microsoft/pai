#!/usr/bin/python
# Copyright (c) Microsoft Corporation
# All rights reserved.
#
# MIT License
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
# documentation files (the "Software"), to deal in the Software without restriction, including without limitation
# the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
# to permit persons to whom the Software is furnished to do so, subject to the following conditions:
# The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
# BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
# DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import copy
import sys
import time
import logging
import re
import datetime

import docker_stats
import docker_inspect
import gpu_exporter
import network
import utils
from utils import Metric

logger = logging.getLogger(__name__)


# k8s will prepend "k8s_" to pod name. There will also be a container name prepend with "k8s_POD_"
# which is a docker container used to construct network & pid namespace for specific container. These
# container prepend with "k8s_POD" consume nothing.
pai_services = map(lambda s: "k8s_" + s, [
    "rest-server",
    "pylon",
    "webportal",
    "grafana",
    "prometheus",
    "alertmanager",
    "watchdog",
    "end-to-end-test",
    "yarn-frameworklauncher",
    "hadoop-jobhistory-service",
    "hadoop-name-node",
    "hadoop-node-manager",
    "hadoop-resource-manager",
    "hadoop-data-node",
    "zookeeper",
    "node-exporter",
    "job-exporter",
    "yarn-exporter",
    "nvidia-drivers"
])


class ZombieRecorder(object):
    def __init__(self):
        self.zombies = {} # key is container id, value is enter zombie time

        # When we first meet zombie container, we only record time of that meet,
        # we wait extra decay_time to report it as zombie. Because at the time
        # of our recording, zombie just produced, and haven't been recycled, we
        # wait 5 minutes to avoid possible cases of normal zombie.
        self.decay_time = datetime.timedelta(minutes=5)

    def update(self, zombie_ids, now):
        """ feed in new zombie ids and get count of decayed zombie """
        # remove all records not exist anymore
        for z_id in self.zombies.keys():
            if z_id not in zombie_ids:
                logger.debug("pop zombie %s that not exist anymore", z_id)
                self.zombies.pop(z_id)

        count = 0
        for current in zombie_ids:
            if current in self.zombies:
                enter_zombie_time = self.zombies[current]
                if now - enter_zombie_time > self.decay_time:
                    count += 1
            else:
                logger.debug("new zombie %s", current)
                self.zombies[current] = now

        return count

    def __len__(self):
        return len(self.zombies)


yarn_pattern = u"container_\w{3}_[0-9]{13}_[0-9]{4}_[0-9]{2}_[0-9]{6}"
yarn_container_reg = re.compile(u"^" + yarn_pattern + "$")
job_container_reg = re.compile(u"^.+(" + yarn_pattern + u")$")


def parse_from_labels(labels):
    gpuIds = []
    otherLabels = {}

    for key, val in labels.items():
        if "container_label_GPU_ID" == key:
            s2 = val.replace("\"", "").split(",")
            for id in s2:
                if id:
                    gpuIds.append(id)
        else:
            otherLabels[key] = val

    return gpuIds, otherLabels


def generate_zombie_count_type1(type1_zombies, exited_containers, now):
    """ this fn will generate zombie container count for the first type,
    exited_containers is container id set of which we believe exited """
    return type1_zombies.update(exited_containers, now)


def generate_zombie_count_type2(type2_zombies, stats, now):
    """ this fn will generate zombie container count for the second type """
    names = set([info["name"] for info in stats.values()])

    job_containers = {} # key is original name, value is corresponding yarn_container name
    yarn_containers = set()

    zombie_ids = set()

    for name in names:
        if re.match(yarn_container_reg, name) is not None:
            yarn_containers.add(name)
        elif re.match(job_container_reg, name) is not None:
            match = re.match(job_container_reg, name)
            value = match.groups()[0]
            job_containers[name] = value
        else:
            pass # ignore

    for job_name, yarn_name in job_containers.items():
        if yarn_name not in yarn_containers:
            zombie_ids.add(job_name)

    return type2_zombies.update(zombie_ids, now)


def docker_logs(container_id, tail="all"):
    try:
        return utils.check_output(["docker", "logs", "--tail", str(tail), str(container_id)])
    except subprocess.CalledProcessError as e:
        logger.exception("command '%s' return with error (code %d): %s",
                e.cmd, e.returncode, e.output)


def is_container_exited(container_id):
    logs = docker_logs(container_id, tail=50)
    if logs is not None and re.search(u"USER COMMAND END", logs):
        return True
    return False


def generate_zombie_count(stats, type1_zombies, type2_zombies):
    """
    There are two types of zombie:
        1. container which outputed "USER COMMAND END" but did not exist for a long period of time
        2. yarn container exited but job container didn't
    """
    exited_containers = set(filter(is_container_exited, stats.keys()))
    logger.debug("exited_containers is %s", exited_containers)

    now = datetime.datetime.now()
    zombie_count1 = generate_zombie_count_type1(type1_zombies, exited_containers, now)
    zombie_count2 = generate_zombie_count_type2(type2_zombies, stats, now)

    return [Metric("zombie_container_count", {}, zombie_count1 + zombie_count2)]


def collect_job_metrics(gpu_infos, all_conns, type1_zombies, type2_zombies):
    stats_obj = docker_stats.stats()
    if stats_obj is None:
        logger.warning("docker stats returns None")
        return None

    result = []
    for container_id, stats in stats_obj.items():
        pai_service_name = None

        # TODO speed this up, since this is O(n^2)
        for service_name in pai_services:
            if stats["name"].startswith(service_name):
                pai_service_name = service_name[4:] # remove "k8s_" prefix
                break

        inspect_info = docker_inspect.inspect(container_id)
        pid = inspect_info["pid"] if inspect_info is not None else None
        inspect_labels = utils.walk_json_field_safe(inspect_info, "labels")

        if not inspect_labels and pai_service_name is None:
            continue # other container, maybe kubelet or api-server

        # get network consumption, since all our services/jobs running in host network,
        # network statistic from docker is not specific to that container. We have to
        # get network statistic by ourselves.
        lsof_result = network.lsof(pid)
        net_in, net_out = network.get_container_network_metrics(all_conns, lsof_result)
        if logger.isEnabledFor(logging.DEBUG):
            debug_info = utils.check_output("ps -o cmd fp {0} | tail -n 1".format(pid), shell=True)

            logger.debug("pid %s with cmd `%s` has lsof result %s, in %d, out %d",
                    pid, debug_info, lsof_result, net_in, net_out)

        if pai_service_name is None:
            gpuIds, otherLabels = parse_from_labels(inspect_info["labels"])
            otherLabels.update(inspect_info["env"])

            for id in gpuIds:
                if gpu_infos:
                    labels = copy.deepcopy(otherLabels)
                    labels["minor_number"] = id

                    result.append(Metric("container_GPUPerc", labels, gpu_infos[id]["gpuUtil"]))
                    result.append(Metric("container_GPUMemPerc", labels, gpu_infos[id]["gpuMemUtil"]))

            result.append(Metric("container_CPUPerc", otherLabels, stats["CPUPerc"]))
            result.append(Metric("container_MemUsage", otherLabels, stats["MemUsage_Limit"]["usage"]))
            result.append(Metric("container_MemLimit", otherLabels, stats["MemUsage_Limit"]["limit"]))
            result.append(Metric("container_NetIn", otherLabels, net_in))
            result.append(Metric("container_NetOut", otherLabels, net_out))
            result.append(Metric("container_BlockIn", otherLabels, stats["BlockIO"]["in"]))
            result.append(Metric("container_BlockOut", otherLabels, stats["BlockIO"]["out"]))
            result.append(Metric("container_MemPerc", otherLabels, stats["MemPerc"]))
        else:
            labels = {"name": pai_service_name}
            result.append(Metric("service_cpu_percent", labels, stats["CPUPerc"]))
            result.append(Metric("service_mem_usage_byte", labels, stats["MemUsage_Limit"]["usage"]))
            result.append(Metric("service_mem_limit_byte", labels, stats["MemUsage_Limit"]["limit"]))
            result.append(Metric("service_mem_usage_percent", labels, stats["MemPerc"]))
            result.append(Metric("service_net_in_byte", labels, net_in))
            result.append(Metric("service_net_out_byte", labels, net_out))
            result.append(Metric("service_block_in_byte", labels, stats["BlockIO"]["in"]))
            result.append(Metric("service_block_out_byte", labels, stats["BlockIO"]["out"]))

    result.extend(generate_zombie_count(stats_obj, type1_zombies, type2_zombies))

    return result

def main(argv):
    log_dir = argv[0]
    gpu_metrics_path = log_dir + "/gpu_exporter.prom"
    job_metrics_path = log_dir + "/job_exporter.prom"
    time_sleep_s = int(argv[1])

    iter = 0

    singleton = utils.Singleton(gpu_exporter.collect_gpu_info)

    type1_zombies = ZombieRecorder()
    type2_zombies = ZombieRecorder()

    while True:
        try:
            logger.info("job exporter running {0} iteration".format(str(iter)))
            iter += 1
            gpu_infos = singleton.try_get()

            gpu_metrics = gpu_exporter.convert_gpu_info_to_metrics(gpu_infos)
            utils.export_metrics_to_file(gpu_metrics_path, gpu_metrics)

            all_conns = network.iftop()
            logger.debug("iftop result is %s", all_conns)

            # join with docker stats metrics and docker inspect labels
            job_metrics = collect_job_metrics(gpu_infos, all_conns, type1_zombies, type2_zombies)
            utils.export_metrics_to_file(job_metrics_path, job_metrics)
        except Exception as e:
            logger.exception("exception in job exporter loop")

        time.sleep(time_sleep_s)


if __name__ == "__main__":
    logging.basicConfig(format="%(asctime)s - %(levelname)s - %(filename)s:%(lineno)s - %(message)s",
            level=logging.INFO)

    main(sys.argv[1:])
