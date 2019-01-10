#!/usr/bin/env python3
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

import re
import datetime
import logging
import threading
import subprocess
import time
import copy

from prometheus_client import make_wsgi_app, Counter, Gauge, Histogram
from prometheus_client.core import GaugeMetricFamily

import network
import utils
import docker_inspect
import docker_stats
import nvidia

logger = logging.getLogger(__name__)


##### collector will generate following metrics
# Document about these metrics is in `` # TODO

iteration_counter = Counter("collector_iteration_count", "total number of iteration",
        ["name"])

def gen_docker_daemon_counter():
    return GaugeMetricFamily("docker_daemon_count",
            "count of docker daemon",
            labels=["error"])

def gen_gpu_util_gauge():
    return GaugeMetricFamily("nvidiasmi_utilization_gpu",
            "gpu core utilization of card",
            labels=["minor_number"])

def gen_gpu_mem_util_gauge():
    return GaugeMetricFamily("nvidiasmi_utilization_memory",
            "gpu memory utilization of card",
            labels=["minor_number"])


class ResourceGauges(object):
    def __init__(self):
        self.task_labels = [
                "container_env_PAI_TASK_INDEX",
                "container_label_PAI_CURRENT_TASK_ROLE_NAME",
                "container_label_PAI_HOSTNAME",
                "container_label_PAI_JOB_NAME",
                "container_label_PAI_USER_NAME"
                ]
        self.service_labels = ["name"]

        self.task_labels_gpu = copy.deepcopy(self.task_labels)
        self.task_labels_gpu.append("minor_number")

        self.gauges = {}

        self.add_task_and_service_gauge("{0}_cpu_percent",
                "how much percent of cpu this {0} used")
        self.add_task_and_service_gauge("{0}_mem_usage_byte",
                "how much memory this {0} used")
        self.add_task_and_service_gauge("{0}_mem_usage_percent",
                "how much percent of memory this {0} used")
        self.add_task_and_service_gauge("{0}_mem_limit_byte",
                "how much memory this {0} are constrained to")
        self.add_task_and_service_gauge("{0}_net_in_byte",
                "how much network inbound this task used")
        self.add_task_and_service_gauge("{0}_net_out_byte",
                "how much network outbound this {0} used")
        self.add_task_and_service_gauge("{0}_block_in_byte",
                "how much block inbound this {0} used")
        self.add_task_and_service_gauge("{0}_block_out_byte",
                "how much block outbound this {0} used")

        self.add_gauge("task_gpu_percent",
                "how much percent of gpu core this task used",
                self.task_labels_gpu)
        self.add_gauge("task_gpu_mem_percent",
                "how much percent of gpu memory this task used",
                self.task_labels_gpu)

    def add_task_and_service_gauge(self, name_tmpl, desc_tmpl):
        self.add_gauge(
                name_tmpl.format("task"),
                desc_tmpl.format("task"),
                self.task_labels)

        self.add_gauge(
                name_tmpl.format("service"),
                desc_tmpl.format("service"),
                self.service_labels)

    def add_gauge(self, name, desc, labels):
        self.gauges[name] = GaugeMetricFamily(name, desc, labels=labels)

    def add_value(self, metric_name, labels, val):
        if metric_name not in self.gauges:
            raise RuntimeError(
                    "{0} not found in gauges, all gauge names is {1}".format(
                        metric_name, ",".join(self.gauges.keys())))

        gauge = self.gauges[metric_name]

        # because prometheus library requires label provided as array, we
        # preprocess the labels and check any missing labels
        label_array = [None] * len(gauge._labelnames)

        for k, v in labels.items():
            try:
                index = gauge._labelnames.index(k)
                label_array[index] = v
            except ValueError:
                logger.warning("unknown label %s with value %s for metrics %s",
                        k, v, metric_name)
                continue

        for i, label_val in enumerate(label_array):
            if label_val is None:
                logger.error(
                        "not provided %s as label value for metric %s, ignore this metric",
                        gauge._labelnames[i], metric_name)
                return

        gauge.add_metric(label_array, val)

    def as_array(self):
        return self.gauges.values()

#####

class AtomicRef(object):
    """ a thread safe way to store and get object,
    should not modify data get from this ref """
    def __init__(self):
        self.data = None
        self.lock = threading.RLock()

    def get_and_set(self, new_data):
        data = None
        with self.lock:
            data, self.data = self.data, new_data
        return data

    def get(self):
        with self.lock:
            return self.data


class Collector(object):
    """ collector is a model running in thread and responsible for collecting
    some metrics, we use thread because we do not want to let hanging in one
    collector can not have impact on other collectors. This is base class,
    real collector should inhernit this class and implement collect_impl,
    metrics are returned as an array."""
    def __init__(self, name, sleep_time, atomic_ref, iteration_counter):
        self.name = name
        self.sleep_time = sleep_time
        self.atomic_ref = atomic_ref
        self.iteration_counter = iteration_counter

        histogram_key = "collector_%s_iteration_lantecy_seconds" % self.name
        histogram_desc = "latency for execute one interation of %s collector (seconds)" % \
                self.name
        self.collector_histogram = Histogram(histogram_key, histogram_desc)

        logger.debug("init %s with sleep_time %d", self.name, self.sleep_time)

    def collect(self):
        while True:
            logger.debug("collecting metrics from %s", self.name)

            with self.collector_histogram.time():
                self.iteration_counter.labels(name=self.name).inc()
                try:
                    self.atomic_ref.get_and_set(self.collect_impl())
                except Exception as e:
                    logger.exception("%s collector get an exception", self.name)

                logger.debug("finished collect metrcis from %s, will sleep for %s",
                        self.name, self.sleep_time)

                time.sleep(self.sleep_time)

    def collect_impl(self):
        """ implementations are expected to return an array of
        prometheus_client's metrics or None on exception """
        pass


def instantiate_collector(name, sleep_time, collector_class, *args):
    """ test cases helper fn to instantiate a collector """
    atomic_ref = AtomicRef()
    return atomic_ref, collector_class(name, sleep_time, atomic_ref, iteration_counter, *args)


def make_collector(name, sleep_time, collector_class, *args):
    """ other module should use this fn to init a collector, this fn start a thread
    to run the collector and return an atomic_ref so outside world can get metrics
    collected by this collector """
    atomic_ref, instance = instantiate_collector(name, sleep_time, collector_class, *args)

    t = threading.Thread(
            target=instance.collect,
            name=name,
            args=(),
            daemon=True)

    t.start()

    return atomic_ref


class DockerCollector(Collector):
    cmd_histogram = Histogram("cmd_docker_active_latency_seconds",
            "Command call latency for checking docker daemon activeness (seconds)")

    cmd_timeout = 1 # 99th latency is 0.01s

    def collect_impl(self):
        cmd = ["docker", "info"]
        error = "ok"

        try:
            out = utils.exec_cmd(cmd,
                    histogram=DockerCollector.cmd_histogram,
                    timeout=DockerCollector.cmd_timeout)

            logger.debug("output for docker info is %s", out)
        except subprocess.CalledProcessError as e:
            logger.exception("command '%s' return with error (code %d): %s",
                    cmd, e.returncode, e.output)
            error = e.strerror()
        except subprocess.TimeoutExpired as e:
            logger.warning("check docker active timeout")
            error = "timeout"
        except Exception as e:
            error = e.strerror()

        counter = gen_docker_daemon_counter()
        counter.add_metric([error], 1)

        return [counter]


class GpuCollector(Collector):
    cmd_histogram = Histogram("cmd_nvidia_smi_latency_seconds",
            "Command call latency for nvidia-smi (seconds)")

    cmd_timeout = 3 # 99th latency is 0.97s

    def __init__(self, name, sleep_time, atomic_ref, iteration_counter, gpu_info_ref):
        Collector.__init__(self, name, sleep_time, atomic_ref, iteration_counter)
        self.gpu_info_ref = gpu_info_ref

    def collect_impl(self):
        gpu_info = nvidia.nvidia_smi(GpuCollector.cmd_histogram,
                GpuCollector.cmd_timeout)

        logger.debug("get gpu_info %s", gpu_info)

        self.gpu_info_ref.get_and_set(gpu_info)

        if gpu_info is not None:
            core_utils = gen_gpu_util_gauge()
            mem_utils = gen_gpu_mem_util_gauge()

            for minor, info in gpu_info.items():
                core_utils.add_metric([minor], info["gpu_util"])
                mem_utils.add_metric([minor], info["gpu_mem_util"])

            return [core_utils, mem_utils]

        return None


class ContainerCollector(Collector):
    stats_histogram = Histogram("cmd_docker_stats_latency_seconds",
            "Command call latency for docker stats (seconds)")
    stats_timeout = 20
    # 99th latency may larger than 10s,
    # Because prometheus's largest bucket for recording histogram is 10s,
    # we can not get value higher than 10s.

    inspect_histogram = Histogram("cmd_docker_inspect_latency_seconds",
            "Command call latency for docker inspect (seconds)")
    inspect_timeout = 1 # 99th latency is 0.042s

    iftop_histogram = Histogram("cmd_iftop_latency_seconds",
            "Command call latency for iftop (seconds)")
    iftop_timeout = 10 # 99th latency is 7.4s

    lsof_histogram = Histogram("cmd_lsof_latency_seconds",
            "Command call latency for lsof (seconds)")
    lsof_timeout = 2 # 99th latency is 0.5s

    pai_services = list(map(lambda s: "k8s_" + s, [
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
        ]))

    def __init__(self, name, sleep_time, atomic_ref, iteration_counter, gpu_info_ref,
            stats_info_ref, interface):
        Collector.__init__(self, name, sleep_time, atomic_ref, iteration_counter)
        self.gpu_info_ref = gpu_info_ref
        self.stats_info_ref = stats_info_ref

        self.network_interface = network.try_to_get_right_interface(interface)
        logger.info("found %s as potential network interface to listen network traffic",
                self.network_interface)

        # k8s will prepend "k8s_" to pod name. There will also be a container name
        # prepend with "k8s_POD_" which is a docker container used to construct
        # network & pid namespace for specific container. These container prepend
        # with "k8s_POD" consume nothing.

    def collect_impl(self):
        all_conns = network.iftop(self.network_interface,
                ContainerCollector.iftop_histogram,
                ContainerCollector.iftop_timeout)

        # set it to None so if nvidia-smi hangs till next time we get,
        # we will get None
        gpu_infos = self.gpu_info_ref.get_and_set(None)

        stats_obj = docker_stats.stats(ContainerCollector.stats_histogram,
                ContainerCollector.stats_timeout)
        self.stats_info_ref.get_and_set(stats_obj)

        logger.debug("all_conns is %s, gpu_info is %s, stats_obj is %s",
                all_conns, gpu_infos, stats_obj)

        return self.collect_container_metrics(stats_obj, gpu_infos, all_conns)

    @staticmethod
    def parse_from_labels(labels):
        gpu_ids = []
        other_labels = {}

        for key, val in labels.items():
            if "container_label_GPU_ID" == key:
                s2 = val.replace("\"", "").split(",")
                for id in s2:
                    if id:
                        gpu_ids.append(id)
            else:
                other_labels[key] = val

        return gpu_ids, other_labels

    @classmethod
    def infer_service_name(cls, container_name):
        """ try to infer service name from container_name, if it's container not belongs
        to pai service, will return None """
        if container_name.startswith("k8s_POD_"):
            # this is empty container created by k8s for pod
            return None

        # TODO speed this up, since this is O(n^2)
        for service_name in cls.pai_services:
            if container_name.startswith(service_name):
                return service_name[4:] # remove "k8s_" prefix

        return None

    def process_one_container(self, container_id, stats, gpu_infos, all_conns, gauges):
        container_name = utils.walk_json_field_safe(stats, "name")
        pai_service_name = ContainerCollector.infer_service_name(container_name)

        inspect_info = docker_inspect.inspect(container_id,
                ContainerCollector.inspect_histogram,
                ContainerCollector.inspect_timeout)

        pid = utils.walk_json_field_safe(inspect_info, "pid")
        inspect_labels = utils.walk_json_field_safe(inspect_info, "labels")

        logger.debug("%s has pid %s, labels %s, service_name %s",
                container_name, pid, inspect_labels, pai_service_name)

        if not inspect_labels and pai_service_name is None:
            logger.debug("%s is ignored", container_name)
            return # other container, maybe kubelet or api-server

        # get network consumption, since all our services/jobs running in host
        # network, and network statistic from docker is not specific to that
        # container. We have to get network statistic by ourselves.
        lsof_result = network.lsof(pid,
                ContainerCollector.lsof_histogram,
                ContainerCollector.lsof_timeout)

        net_in, net_out = network.get_container_network_metrics(all_conns,
                lsof_result)
        if logger.isEnabledFor(logging.DEBUG):
            debug_info = utils.exec_cmd(
                    "ps -o cmd fp {0} | tail -n 1".format(pid),
                    shell=True)

            logger.debug("pid %s with cmd `%s` has lsof result %s, in %d, out %d",
                    pid, debug_info.strip(), lsof_result, net_in, net_out)

        if pai_service_name is None:
            gpu_ids, container_labels = ContainerCollector.parse_from_labels(inspect_info["labels"])
            container_labels.update(inspect_info["env"])

            if gpu_infos:
                for id in gpu_ids:
                    labels = copy.deepcopy(container_labels)
                    labels["minor_number"] = id

                    gauges.add_value("task_gpu_percent",
                            labels, gpu_infos[id]["gpu_util"])
                    gauges.add_value("task_gpu_mem_percent",
                            labels, gpu_infos[id]["gpu_mem_util"])

            gauges.add_value("task_cpu_percent", container_labels, stats["CPUPerc"])
            gauges.add_value("task_mem_usage_byte", container_labels, stats["MemUsage_Limit"]["usage"])
            gauges.add_value("task_mem_limit_byte", container_labels, stats["MemUsage_Limit"]["limit"])
            gauges.add_value("task_net_in_byte", container_labels, net_in)
            gauges.add_value("task_net_out_byte", container_labels, net_out)
            gauges.add_value("task_block_in_byte", container_labels, stats["BlockIO"]["in"])
            gauges.add_value("task_block_out_byte", container_labels, stats["BlockIO"]["out"])
            gauges.add_value("task_mem_usage_percent", container_labels, stats["MemPerc"])
        else:
            labels = {"name": pai_service_name}
            gauges.add_value("service_cpu_percent", labels, stats["CPUPerc"])
            gauges.add_value("service_mem_usage_byte", labels, stats["MemUsage_Limit"]["usage"])
            gauges.add_value("service_mem_limit_byte", labels, stats["MemUsage_Limit"]["limit"])
            gauges.add_value("service_mem_usage_percent", labels, stats["MemPerc"])
            gauges.add_value("service_net_in_byte", labels, net_in)
            gauges.add_value("service_net_out_byte", labels, net_out)
            gauges.add_value("service_block_in_byte", labels, stats["BlockIO"]["in"])
            gauges.add_value("service_block_out_byte", labels, stats["BlockIO"]["out"])

    def collect_container_metrics(self, stats_obj, gpu_infos, all_conns):
        if stats_obj is None:
            logger.warning("docker stats returns None")
            return None

        gauges = ResourceGauges()

        for container_id, stats in stats_obj.items():
            try:
                self.process_one_container(container_id, stats, gpu_infos, all_conns, gauges)
            except Exception:
                logger.exception("error when trying to process container %s with name %s",
                        container_id, utils.walk_json_field_safe(stats, "name"))

        return gauges.as_array()


class ZombieCollector(Collector):
    logs_histogram = Histogram("cmd_docker_logs_latency_seconds",
            "Command call latency for docker logs (seconds)")
    logs_timeout = 1 # 99th latency is 0.04s

    zombie_container_count = Gauge("zombie_container_count",
            "number of zombie container found for this node",
            ["type"])

    class ZombieRecorder(object):
        def __init__(self, type):
            self.type = type
            self.zombies = {} # key is container id, value is enter zombie time

            # When we first meet zombie container, we only record time of that meet,
            # we wait extra decay_time to report it as zombie. Because at the time
            # of our recording, zombie just produced, and haven't been recycled, we
            # wait 5 minutes to avoid possible cases of normal zombie.
            self.decay_time = datetime.timedelta(minutes=5)

        def update(self, zombie_ids, now):
            """ feed in new zombie ids and get count of decayed zombie """
            # remove all records not exist anymore
            for z_id in list(self.zombies.keys()):
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

            ZombieCollector.zombie_container_count.labels(self.type).set(count)
            return count # for test

        def __len__(self):
            return len(self.zombies)

    def __init__(self, name, sleep_time, atomic_ref, iteration_counter, stats_info_ref):
        Collector.__init__(self, name, sleep_time, atomic_ref, iteration_counter)
        self.stats_info_ref = stats_info_ref

        self.type1_zombies = ZombieCollector.ZombieRecorder("job_exit_hangs")
        self.type2_zombies = ZombieCollector.ZombieRecorder("residual_job")

        self.yarn_pattern = u"container_\w{3}_[0-9]{13}_[0-9]{4}_[0-9]{2}_[0-9]{6}"
        self.yarn_container_reg = re.compile(u"^" + self.yarn_pattern + "$")
        self.job_container_reg = re.compile(u"^.+(" + self.yarn_pattern + u")$")

    def update_zombie_count_type1(self, exited_containers, now):
        """ this fn will generate zombie container count for the first type,
        exited_containers is container id set of which we believe exited """
        return self.type1_zombies.update(exited_containers, now)

    def update_zombie_count_type2(self, stats, now):
        """ this fn will generate zombie container count for the second type """
        names = set([info["name"] for info in stats.values()])

        job_containers = {} # key is original name, value is corresponding yarn_container name
        yarn_containers = set()

        zombie_ids = set()

        for name in names:
            if re.match(self.yarn_container_reg, name) is not None:
                yarn_containers.add(name)
            elif re.match(self.job_container_reg, name) is not None:
                match = re.match(self.job_container_reg, name)
                value = match.groups()[0]
                job_containers[name] = value
            else:
                pass # ignore

        for job_name, yarn_name in job_containers.items():
            if yarn_name not in yarn_containers:
                zombie_ids.add(job_name)

        return self.type2_zombies.update(zombie_ids, now)

    def docker_logs(self, container_id, tail="all"):
        try:
            return utils.exec_cmd(
                    ["docker", "logs", "--tail", str(tail), str(container_id)],
                    histogram=ZombieCollector.logs_histogram,
                    stderr=subprocess.STDOUT, # also capture stderr output
                    timeout=ZombieCollector.logs_timeout)
        except subprocess.TimeoutExpired as e:
            logger.warning("docker log timeout")
        except subprocess.CalledProcessError as e:
            logger.warning("docker logs returns %d, output %s", e.returncode, e.output)
        except Exception:
            logger.exception("exec docker logs error")

        return ""

    def is_container_exited(self, container_id):
        logs = self.docker_logs(container_id, tail=50)
        if re.search(u"USER COMMAND END", logs):
            return True
        return False

    def update_zombie_count(self, stats):
        """
        There are two types of zombie:
            1. container which outputed "USER COMMAND END" but did not exist for a long period of time
            2. yarn container exited but job container didn't
        """
        if stats is None:
            logger.warning("docker stats is None")
            return

        exited_containers = set(filter(self.is_container_exited, stats.keys()))

        now = datetime.datetime.now()
        self.update_zombie_count_type1(exited_containers, now)
        self.update_zombie_count_type2(stats, now)

    def collect_impl(self):
        # set it to None so if docker-stats hangs till next time we get,
        # we will get None
        stats_info = self.stats_info_ref.get_and_set(None)
        self.update_zombie_count(stats_info)
