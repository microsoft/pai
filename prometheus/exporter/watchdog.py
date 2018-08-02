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

import urlparse
import os
import subprocess
import json
import sys
import requests
import logging
from logging.handlers import RotatingFileHandler
import time
import common
import collections
import copy

import utils
from utils import Metric

logger = logging.getLogger(__name__)


class MetricEntity(object):
    """ interface that has one method that can convert this obj into Metric """
    def to_metric(self):
        pass


class PaiPod(MetricEntity):
    """ represent a pod count, all fields except condition_map should of type string """

    def __init__(self, name, phase, host_ip, condition_map):
        self.name = name
        self.phase = phase # should be lower case
        self.host_ip = host_ip # maybe None
        self.condition_map = condition_map

    def to_metric(self):
        label = {"name": self.name, "phase": self.phase}

        if self.host_ip is not None:
            label["host_ip"] = self.host_ip

        for k, v in self.condition_map.items():
            label[k] = v

        return Metric("pai_pod_count", label, 1)


class PaiContainer(MetricEntity):
    """ represent a container count, all fields should of type string """

    def __init__(self, service_name, name, state, ready):
        self.service_name = service_name
        self.name = name
        self.state = state
        self.ready = ready

    def to_metric(self):
        label = {"service_name": self.service_name, "name": self.name, "state": self.state,
                "ready": self.ready}
        return Metric("pai_container_count", label, 1)


class PaiNode(MetricEntity):
    """ will output metric like
    pai_node_count{name="1.2.3.4", out_of_disk="true", memory_pressure="true"} 1 """

    def __init__(self, name, condition_map):
        self.name = name
        # key should be underscore instead of camel case, value should be lower case
        self.condition_map = condition_map

    def to_metric(self):
        label = {"name": self.name}
        for k, v in self.condition_map.items():
            label[k] = v

        return Metric("pai_node_count", label, 1)


def catch_exception(fn, msg, default, *args, **kwargs):
    """ wrap fn call with try catch, makes watchdog more robust """
    try:
        return fn(*args, **kwargs)
    except Exception as e:
        logger.exception(msg)
        return default


def keep_not_none(item):
    """ used in filter to keep item that is not None """
    return item is not None


def to_metric(metric_entity):
    return metric_entity.to_metric()


def parse_pod_item(pod):
    """ return pai_pod and list of pai_container, return None on not pai service
    Because we are parsing json outputed by k8s, its format is subjected to change,
    we should test if field exists before accessing it to avoid KeyError """
    labels = pod["metadata"].get("labels")
    if labels is None or "app" not in labels.keys():
        logger.warning("unkown pod %s", pod["metadata"]["name"])
        return None

    service_name = labels["app"] # get pai service name from label

    status = pod["status"]

    if status.get("phase") is not None:
        phase = status["phase"].lower()
    else:
        phase = "unknown"

    host_ip = None
    if status.get("hostIP") is not None:
        host_ip = status["hostIP"]

    condition_map = {}

    conditions = status.get("conditions")
    if conditions is not None:
        for cond in conditions:
            cond_t = cond["type"].lower() # Initialized|Ready|PodScheduled
            cond_status = cond["status"].lower()

            condition_map[cond_t] = cond_status

    pai_pod = PaiPod(service_name, phase, host_ip, condition_map)

    # generate pai_containers
    pai_containers = []

    if status.get("containerStatuses") is not None:
        container_statuses = status["containerStatuses"]

        for container_status in container_statuses:
            container_name = container_status["name"]

            ready = False

            if container_status.get("ready") is not None:
                ready = container_status["ready"]

            container_state = None
            if container_status.get("state") is not None:
                state = container_status["state"]
                if len(state) != 1:
                    logger.error("unexpected state %s in container %s",
                            json.dumps(state), container_name)
                else:
                    container_state = state.keys()[0].lower()

            pai_containers.append(PaiContainer(service_name, container_name,
                container_state, str(ready).lower()))

    return pai_pod, pai_containers


def robust_parse_pod_item(item):
    return catch_exception(parse_pod_item,
            "catch exception when parsing pod item",
            None,
            item)


def parse_pods_status(podsJsonObject):
    metrics = []

    results = filter(keep_not_none,
            map(robust_parse_pod_item, podsJsonObject["items"]))

    pai_pods = map(lambda result: result[0], results)
    pai_containers = map(lambda result: result[1], results)
    pai_containers = [subitem for sublist in pai_containers for subitem in sublist]

    pod_metrics = map(to_metric, pai_pods)
    container_metrics = map(to_metric, pai_containers)

    return pod_metrics + container_metrics


def collect_healthz(metric_name, address, port, url):
    label = {"address": address, "error": "ok"}

    try:
        healthy = requests.get("http://{}:{}{}".format(address, port, url)).text

        if healthy != "ok":
            label["error"] = healthy
    except Exception as e:
        label["error"] = str(e)
        logger.exception("requesting %s:%d%s failed", address, port, url)

    return Metric(metric_name, label, 1)


def collect_k8s_componentStaus(api_server_ip, api_server_port, nodesJsonObject):
    metrics = []

    metrics.append(collect_healthz("k8s_api_server_count", api_server_ip, api_server_port, "/healthz"))
    metrics.append(collect_healthz("k8s_etcd_count", api_server_ip, api_server_port, "/healthz/etcd"))

    # check kubelet
    nodeItems = nodesJsonObject["items"]

    for name in nodeItems:
        ip = name["metadata"]["name"]

        metrics.append(collect_healthz("k8s_kubelet_count", ip, 10255, "/healthz"))

    return metrics


def parse_node_item(node):
    name = node["metadata"]["name"]

    cond_map = {}

    if node.get("status") is not None:
        status = node["status"]

        if status.get("conditions") is not None:
            conditions = status["conditions"]

            for cond in conditions:
                cond_t = utils.camel_to_underscore(cond["type"])
                status = cond["status"].lower()

                cond_map[cond_t] = status
    else:
        logger.warning("unexpected structure of node %s: %s", name, json.dumps(node))

    return PaiNode(name, cond_map)


def robust_parse_node_item(item):
    return catch_exception(parse_node_item,
            "catch exception when parsing node item",
            None,
            item)


def parse_nodes_status(nodesJsonObject):
    nodeItems = nodesJsonObject["items"]

    return map(to_metric,
            map(robust_parse_node_item, nodesJsonObject["items"]))


def collect_docker_daemon_status(hosts):
    metrics = []

    cmd = "sudo systemctl is-active docker | if [ $? -eq 0 ]; then echo \"active\"; else exit 1 ; fi"

    for host in hosts:
        label = {"ip": host["hostip"], "error": "ok"}

        try:
            flag = common.ssh_shell_paramiko(host, cmd)
            if not flag:
                label["error"] = "config" # configuration is not correct
        except Exception as e:
            label["error"] = str(e)
            logger.exception("ssh to %s failed", host["hostip"])

        metrics.append(Metric("docker_daemon_count", label, 1))

    return metrics


def log_and_export_metrics(path, metrics):
    utils.export_metrics_to_file(path, metrics)
    for metric in metrics:
        logger.info(metric)


def load_machine_list(configFilePath):
    cluster_config = common.load_yaml_file(configFilePath)
    return cluster_config['hosts']


#####
# Watchdog generate 7 metrics:
# * pai_pod_count
# * pai_container_count
# * pai_node_count
# * docker_daemon_count
# * k8s_api_server_count
# * k8s_etcd_count
# * k8s_kubelet_count
# Document about these metrics is in `prometheus/doc/watchdog-metrics.md`
#####

def main(argv):
    logDir = argv[0]
    timeSleep = int(argv[1])

    address = os.environ["K8S_API_SERVER_URI"]
    parse_result = urlparse.urlparse(address)
    api_server_ip = parse_result.hostname
    api_server_port = parse_result.port or 80

    hosts = load_machine_list("/etc/watchdog/config.yml")

    rootLogger = logging.getLogger()
    rootLogger.setLevel(logging.INFO)
    fh = RotatingFileHandler(logDir + "/watchdog.log", maxBytes= 1024 * 1024 * 100, backupCount=5)
    fh.setLevel(logging.INFO)
    formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(filename)s:%(lineno)s - %(message)s")
    fh.setFormatter(formatter)
    rootLogger.addHandler(fh)

    while True:
        try:
            metrics = []

            # 1. check service level status
            podsStatus = requests.get("{}/api/v1/namespaces/default/pods/".format(address)).json()
            pods_metrics = parse_pods_status(podsStatus)
            if pods_metrics is not None:
                metrics.extend(pods_metrics)

            # 2. check nodes level status
            nodesStatus = requests.get("{}/api/v1/nodes/".format(address)).json()
            nodes_metrics = parse_nodes_status(nodesStatus)
            if nodes_metrics is not None:
                metrics.extend(nodes_metrics)

            # 3. check docker deamon status
            docker_daemon_metrics = collect_docker_daemon_status(hosts)
            if docker_daemon_metrics is not None:
                metrics.extend(docker_daemon_metrics)

            # 4. check k8s level status
            k8s_metrics = collect_k8s_componentStaus(api_server_ip, api_server_port, nodesStatus)
            if k8s_metrics is not None:
                metrics.extend(k8s_metrics)

            # 5. log and export
            log_and_export_metrics(logDir + "/watchdog.prom", metrics)
        except Exception as e:
            logger.exception("watchdog failed in one iteration")

            # do not lost metrics due to exception
            log_and_export_metrics(logDir + "/watchdog.prom", metrics)

        time.sleep(timeSleep)

# python watch_dog.py /datastorage/prometheus /usr/local/cluster-configuration.yaml 3
# requires env K8S_API_SERVER_URI set to correct value, eg. http://10.151.40.133:8080
if __name__ == "__main__":
    main(sys.argv[1:])
