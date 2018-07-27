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

class Service:
    kube_pod_status_probe_not_ready = 0
    kube_pod_status_phase_failed = 0
    kube_pod_status_phase_unknown = 0
    pod_container_status_waiting = 0
    pod_container_status_terminated = 0
    pod_container_status_not_ready = 0
    pod_container_status_restart_total = 0

def parse_pods_status(podsJsonObject):
    kube_pod_status_probe_not_ready = 0
    kube_pod_status_phase_failed = 0
    kube_pod_status_phase_unknown = 0
    pod_container_status_waiting = 0
    pod_container_status_terminated = 0
    pod_container_status_not_ready = 0
    pod_container_status_restarted_pod_count = 0

    metrics = []

    serviceMetrics = collections.defaultdict(lambda : Service())
    existServiceKey = {}

    podItems = podsJsonObject["items"]

    for pod in podItems:
        # all / per pod phase failed/unkown/Not ready (condition)
        serviceName = ""

        if "generateName" in pod["metadata"]:
            serviceName = pod["metadata"]["generateName"]
        else:
            serviceName = pod["metadata"]["name"]

        service = serviceMetrics[serviceName]

        status = pod["status"]
        phase = status["phase"]
        conditions = status["conditions"]
        ready = "True"
        init = "True"
        scheduled = "True"

        # 1. check not ready pod
        for condition in conditions:
            if condition["type"] == "Ready":
                ready = condition["status"]
            elif condition["type"] == "Initialized":
                init = condition["status"]
            elif condition["type"] == "PodScheduled":
                scheduled = condition["status"]

        # NOTE: this map will be reused in multiple metrics, do not modify this map
        label = {"pod": pod["metadata"]["name"], "hostip": pod["status"]["hostIP"]}

        if ready != "True" and init == "True" and scheduled == "True":
            kube_pod_status_probe_not_ready += 1
            # specific pod occurs readiness probe failed error, condition is not ready, value is 1
            metrics.append(Metric("pod_current_probe_not_ready", label, 1))
            service.kube_pod_status_probe_not_ready += 1

        # 2. check failed phase pods
        if phase == "Failed":
            kube_pod_status_phase_failed += 1
            # specific pod phase become faile, value is 1
            metrics.append(Metric("pod_current_phase_failed", label, 1))
            service.kube_pod_status_phase_failed += 1

        # 3. check unknown phase pods
        if phase == "Unknown":
            kube_pod_status_phase_unknown += 1
            # specific pod phase become unknown, value is 1
            metrics.append(Metric("pod_current_phase_unknown", label, 1))
            service.kube_pod_status_phase_unknown += 1

        containerStatus = status["containerStatuses"]

        # 4. check pod containers running/waiting/terminated status
        for perContainerStatus in containerStatus:
            containerReady = perContainerStatus["ready"]
            restartCount = perContainerStatus["restartCount"]

            containerLabel = copy.deepcopy(label)
            containerLabel["container"] = perContainerStatus["name"]

            if not containerReady:
                pod_container_status_not_ready +=1
                # specific pod contains container status is not ready, value is 1
                metrics.append(Metric("container_current_not_ready", containerLabel, 1))
                service.pod_container_status_not_ready += 1

            state = perContainerStatus["state"]
            if "terminated" in state:
                pod_container_status_terminated += 1
                # specific pod container status is terminated total count, value is 1
                metrics.append(Metric("container_current_terminated", containerLabel, 1))
                service.pod_container_status_terminated += 1

            if "waiting" in state:
                pod_container_status_waiting += 1
                # specific pod container status is waiting  total count, value is 1
                metrics.append(Metric("container_current_waiting", containerLabel, 1))
                service.pod_container_status_waiting += 1

            if restartCount > 0:
                pod_container_status_restarted_pod_count += 1
                # specific pod's container restart total count
                metrics.append(Metric("container_accumulation_restart_total", containerLabel, restartCount))
                service.pod_container_status_restart_total += 1

    # service level aggregation metrics
    for serviceName, service in serviceMetrics.items():
        label = {"service": serviceName}
        # each service occurs readiness probe failed error, condition is not ready, total count
        if service.kube_pod_status_probe_not_ready != 0:
            metrics.append(Metric("service_current_probe_not_ready_pod_count", label,
                service.kube_pod_status_probe_not_ready))
        # each service pods' phase become failed total count
        if service.kube_pod_status_phase_failed != 0:
            metrics.append(Metric("service_current_phase_failed_pod_count", label,
                service.kube_pod_status_phase_failed))
        # each service pods' phase become unknown total count
        if service.kube_pod_status_phase_unknown != 0:
            metrics.append(Metric("service_current_phase_unknown_pod_count", label,
                service.kube_pod_status_phase_unknown))
        # each service pods' contains container status is not ready total count
        if service.pod_container_status_waiting != 0:
            metrics.append(Metric("service_current_waiting_container_count", label,
                service.pod_container_status_waiting))
        # each service pods' container status is terminated total count
        if service.pod_container_status_terminated != 0:
            metrics.append(Metric("service_current_terminated_container_count", label,
                service.pod_container_status_terminated))
        # each service pods' container status is waiting  total count
        if service.pod_container_status_not_ready != 0:
            metrics.append(Metric("service_current_probe_not_ready_pod_count", label,
                service.pod_container_status_not_ready))
        # each service pods' container restart total count
        if service.pod_container_status_restart_total != 0:
            metrics.append(Metric("service_restarted_container_count", label,
                service.pod_container_status_restart_total))

    emptyLabel = {}
    metrics.append(Metric("cluster_current_probe_not_ready_pod_count", emptyLabel, kube_pod_status_probe_not_ready))
    metrics.append(Metric("cluster_current_phase_failed_pod_count", emptyLabel, kube_pod_status_phase_failed))
    metrics.append(Metric("cluster_phase_unknown_pod_count", emptyLabel, kube_pod_status_phase_unknown))
    metrics.append(Metric("cluster_current_status_not_ready_container_count", emptyLabel, pod_container_status_not_ready))
    metrics.append(Metric("cluster_current_terminated_container_count", emptyLabel, pod_container_status_terminated))
    metrics.append(Metric("cluster_current_waiting_container_count", emptyLabel, pod_container_status_waiting))
    metrics.append(Metric("cluster_container_once_restarted_pod_count", emptyLabel, pod_container_status_restarted_pod_count))

    return metrics

def collect_k8s_componentStaus(address, nodesJsonObject):
    metrics = []

    emptyLabel = {}

    # 1. check api server
    try:
        apiServerhealty = requests.get("{}/healthz".format(address)).text

        if apiServerhealty != "ok":
            # api server health status, 1 is error
            metrics.append(Metric("apiserver_current_status_error", emptyLabel, 1))
    except Exception as e:
        logger.exception("get api server status failed")
        metrics.append(Metric("apiserver_current_status_error", emptyLabel, 1))

    # 2. check etcd
    try:
        etcdhealty = requests.get("{}/healthz/etcd".format(address)).text

        if etcdhealty != "ok":
            # etcd health status, 1 is error
            metrics.append(Metric("etcd_current_status_error", emptyLabel, 1))
    except Exception as e:
        logger.exception("get etcd status failed")
        metrics.append(Metric("etcd_current_status_error", emptyLabel, 1))

    # 3. check kubelet
    nodeItems = nodesJsonObject["items"]
    kubeletErrorCount = 0

    for name in nodeItems:
        ip = name["metadata"]["name"]

        label = {"node": ip}

        try:
            kubeletHealthy = requests.get("http://{}:{}/healthz".format(ip, 10255)).text

            if kubeletHealthy != "ok":
                # each node kubelet health status, 1 is error
                metrics.append(Metric("kubelet_current_status_error", label, 1))
                kubeletErrorCount += 1
        except Exception as e:
            kubeletErrorCount += 1
            logger.exception("get kubelet status failed")
            metrics.append(Metric("kubelet_current_status_error", label, 1))

    metrics.append(Metric("current_status_error_kubelet_count", emptyLabel, kubeletErrorCount))

    return metrics

def parse_nodes_status(nodesJsonObject):
    nodeItems = nodesJsonObject["items"]

    metrics = []
    readyNodeCount = 0
    dockerError = 0

    for name in nodeItems:
        # 1. check each node status
        for condition in name["status"]["conditions"]:
            if "Ready" == condition["type"]:
                readyStatus = condition["status"]
                if readyStatus != "True":
                    # node status, value 1 is error
                    label = {"node": name["metadata"]["name"]}
                    metrics.append(Metric("node_current_notready", label, 1))
                else:
                    readyNodeCount += 1

    metrics.append(Metric("notready_node_count", {}, len(nodeItems) - readyNodeCount))
    return metrics

def collect_docker_daemon_status(configFilePath):
    metrics = []

    cluster_config = common.load_yaml_file(configFilePath)
    node_configs = cluster_config['machine-list']
    username = ""
    password = ""
    sshport = ""

    if "default-machine-properties" in cluster_config:
        if "username" in cluster_config["default-machine-properties"]:
            username = cluster_config["default-machine-properties"]["username"]
        if "password" in cluster_config["default-machine-properties"]:
            password = cluster_config["default-machine-properties"]["password"]
        if "sshport" in cluster_config["default-machine-properties"]:
            port = cluster_config["default-machine-properties"]["sshport"]

    cmd = "sudo systemctl is-active docker | if [ $? -eq 0 ]; then echo \"active\"; else exit 1 ; fi"
    errorNodeCout = 0

    for node_config in node_configs:
        ip = node_config["hostip"]
        label = {"instance": ip}

        try:
            if "username" not in node_config or "password" not in node_config or "sshport" not in node_config:
                node_config["username"] = username
                node_config["password"] = password
                node_config["port"] = port

            flag = common.ssh_shell_paramiko(node_config, cmd)
            if not flag:
                errorNodeCout += 1
                # single node docker health
                metrics.append(Metric("node_current_docker_error", label, 1))
        except Exception as e:
            logger.exception("ssh to %s failed", ip)
            errorNodeCout += 1
            metrics.append(Metric("node_current_docker_error", label, 1))

    if errorNodeCout > 0:
        metrics.append(Metric("docker_error_node_count", {}, errorNodeCout))

    return metrics

def log_and_export_metrics(path, metrics):
    utils.export_metrics_to_file(path, metrics)
    for metric in metrics:
        logger.info(metric)

def main(argv):
    logDir = argv[0]
    configFilePath = argv[1]
    timeSleep = int(argv[2])
    address = os.environ["K8S_API_SERVER_URI"]

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
            docker_daemon_metrics = collect_docker_daemon_status(configFilePath)
            if docker_daemon_metrics is not None:
                metrics.extend(docker_daemon_metrics)

            # 4. check k8s level status
            k8s_metrics = collect_k8s_componentStaus(address, nodesStatus)

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
