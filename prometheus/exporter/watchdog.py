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

loggerRoot = logging.getLogger()
logger = logging.getLogger("watchdog")
loggerCommon = logging.getLogger("common")

class Service:
    name = ""
    kube_pod_status_probe_not_ready = 0
    kube_pod_status_phase_failed = 0
    kube_pod_status_phase_unknown = 0
    pod_container_status_waiting = 0
    pod_container_status_terminated = 0
    pod_container_status_not_ready = 0
    pod_container_status_restart_total = 0

def parse_pods_status(podsJsonObject, outputFile):
    # metrics
    kube_pod_status_probe_not_ready = 0
    kube_pod_status_phase_failed = 0
    kube_pod_status_phase_unknown = 0
    pod_container_status_waiting = 0
    pod_container_status_terminated = 0
    pod_container_status_not_ready = 0
    pod_container_status_restarted_pod_count = 0
    podItems = podsJsonObject["items"]
    serviceMetrics = []
    existServiceKey = {}
    for pod in podItems:
        # all / per pod phase failed/unkown/Not ready (condition)
        serviceName = ""

        if "generateName" in pod["metadata"]:
            serviceName = pod["metadata"]["generateName"]
        else:
            serviceName = pod["metadata"]["name"]

        if serviceName not in existServiceKey:
            service = Service()
            service.name = serviceName
            existServiceKey[serviceName] = 1
            serviceMetrics.append(service)
        else:
            for sr in serviceMetrics:
                if sr.name == serviceName:
                    service = sr
                    break

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

        if ready != "True" and init == "True" and scheduled == "True":
            kube_pod_status_probe_not_ready += 1
            # specific pod occurs readiness probe failed error, condition is not ready, value is 1
            logger.error("pod_current_probe_not_ready{{pod=\"{}\", hostip=\"{}\"}} {}\n".format(pod["metadata"]["name"], pod["status"]["hostIP"], 1))
            service.kube_pod_status_probe_not_ready += 1
        # 2. check failed phase pods
        if phase == "Failed":
            kube_pod_status_phase_failed += 1
            # specific pod phase become faile, value is 1
            logger.error("pod_current_phase_failed{{pod=\"{0}\", hostip=\"{}\"}} {1}\n".format(pod["metadata"]["name"], pod["status"]["hostIP"], 1))
            service.kube_pod_status_phase_failed += 1

        # 3. check unknown phase pods
        if phase == "Unknown":
            kube_pod_status_phase_unknown += 1
            # specific pod phase become unknown, value is 1
            logger.error(" pod_current_phase_unknown{{pod=\"{0}\", hostip=\"{}\"}} {1}\n".format(pod["metadata"]["name"], pod["status"]["hostIP"], 1))
            service.kube_pod_status_phase_unknown += 1

        containerStatus = status["containerStatuses"]

        # 4. check pod containers running/waiting/terminated status
        for perContainerStatus in containerStatus:
            containerReady = perContainerStatus["ready"]
            restartCount = perContainerStatus["restartCount"]
            if not containerReady:
                pod_container_status_not_ready +=1
                # specific pod contains container status is not ready, value is 1
                logger.error("container_current_not_ready{{pod=\"{0}\", container=\"{1}\", hostip=\"{2}\"}} {3}\n".format(pod["metadata"]["name"], perContainerStatus["name"], pod["status"]["hostIP"], 1))
                service.pod_container_status_not_ready += 1

            state = perContainerStatus["state"]
            if "terminated" in state:
                pod_container_status_terminated += 1
                # specific pod container status is terminated total count, value is 1
                logger.error("container_current_terminated{{pod=\"{0}\", container=\"{1}\", hostip=\"{2}\"}} {3}\n".format(pod["metadata"]["name"], perContainerStatus["name"], pod["status"]["hostIP"], 1))
                service.pod_container_status_terminated += 1

            if "waiting" in state:
                pod_container_status_waiting += 1
                # specific pod container status is waiting  total count, value is 1
                logger.error("container_current_waiting{{pod=\"{0}\", container=\"{1}\", hostip=\"{2}\"}} {3}\n".format(pod["metadata"]["name"], perContainerStatus["name"], pod["status"]["hostIP"], 1))
                service.pod_container_status_waiting += 1

            if restartCount > 0:
                pod_container_status_restarted_pod_count += 1
                # specific pod's container restart total count
                logger.error("container_accumulation_restart_total{{pod=\"{0}\", container=\"{1}\", instance=\"{2}\"}} {3}\n".format(pod["metadata"]["name"], perContainerStatus["name"], pod["status"]["hostIP"], restartCount))
                service.pod_container_status_restart_total += 1

    # service level aggregation metrics
    for service in serviceMetrics:
        # each service occurs readiness probe failed error, condition is not ready, total count
        if service.kube_pod_status_probe_not_ready != 0:
            logger.error("service_current_probe_not_ready_pod_count{{service=\"{}\"}} {}\n".format(service.name, service.kube_pod_status_probe_not_ready))
        # each service pods' phase become failed total count
        if service.kube_pod_status_phase_failed != 0:
            logger.error("service_current_phase_failed_pod_count{{service=\"{}\"}} {}\n".format(service.name, service.kube_pod_status_phase_failed))
        # each service pods' phase become unknown total count
        if service.kube_pod_status_phase_unknown != 0:
            logger.error("service_current_phase_unknown_pod_count{{service=\"{}\"}} {}\n".format(service.name, service.kube_pod_status_phase_unknown))
        # each service pods' contains container status is not ready total count
        if service.pod_container_status_waiting != 0:
            logger.error("service_current_not_ready_container_count{{service=\"{}\"}} {}\n".format(service.name, service.pod_container_status_waiting))
        # each service pods' container status is terminated total count
        if service.pod_container_status_terminated != 0:
            logger.error("service_current_terminated_container_count{{service=\"{}\"}} {}\n".format(service.name, service.pod_container_status_terminated))
        # each service pods' container status is waiting  total count
        if service.pod_container_status_not_ready != 0:
            logger.error("service_current_waiting_container_count{{service=\"{}\"}} {}\n".format(service.name, service.pod_container_status_not_ready))
        # each service pods' container restart total count
        if service.pod_container_status_restart_total != 0:
            logger.error("service_restarted_container_count{{service=\"{}\"}} {}\n".format(service.name, service.pod_container_status_restart_total))

    # aggregate whole cluster level service metrics
    # cluster pods' occurs readiness probe failed error, condition is not ready, total count
    outputFile.write("cluster_current_probe_not_ready_pod_count {}\n".format(kube_pod_status_probe_not_ready))
    # cluster pods' phase become failed total count
    outputFile.write("cluster_current_phase_failed_pod_count {}\n".format(kube_pod_status_phase_failed))
    # cluster pods' phase become unknown total count
    outputFile.write("cluster_phase_unknown_pod_count {}\n".format(kube_pod_status_phase_unknown))
    # cluster pods' contains container status is not ready total count
    outputFile.write("cluster_current_status_not_ready_container_count {}\n".format(pod_container_status_not_ready))
    # cluster pods' container status is terminated total count
    outputFile.write("cluster_current_terminated_container_count {}\n".format(pod_container_status_terminated))
    # cluster pods' container status is waiting  total count
    outputFile.write("cluster_current_waiting_container_count {}\n".format(pod_container_status_waiting))
    # cluster pods' container restart total count
    outputFile.write("cluster_container_once_restarted_pod_count {}\n".format(pod_container_status_restarted_pod_count))

    logger.info("cluster_current_probe_not_ready_pod_count {}\n".format(kube_pod_status_probe_not_ready))
    logger.info("cluster_current_phase_failed_pod_count {}\n".format(kube_pod_status_phase_failed))
    logger.info("cluster_phase_unknown_pod_count {}\n".format(kube_pod_status_phase_unknown))
    logger.info("cluster_current_status_not_ready_container_count {}\n".format(pod_container_status_not_ready))
    logger.info("cluster_current_terminated_container_count {}\n".format(pod_container_status_terminated))
    logger.info("cluster_current_waiting_container_count {}\n".format(pod_container_status_waiting))
    logger.info("cluster_container_once_restarted_pod_count {}\n".format(pod_container_status_restarted_pod_count))
    return

def check_k8s_componentStaus(address, nodesJsonObject, outputFile):
    # 1. check api server
    try:
        apiServerhealty = requests.get("{}/healthz".format(address)).text

        if apiServerhealty != "ok":
            # api server health status, 1 is error
            apiserverHealthStr = 'apiserver_current_status_error {0}\n'.format(1)
            logger.error(apiserverHealthStr)
            outputFile.write(apiserverHealthStr)
    except:
        exception = sys.exc_info()
        for e in exception:
            logger.error("watchdog error {}".format(e))
        apiserverHealthStr = 'apiserver_current_status_error {0}\n'.format(1)
        logger.error(apiserverHealthStr)
        outputFile.write(apiserverHealthStr)

    # 2. check etcd
    try:
        etcdhealty = requests.get("{}/healthz/etcd".format(address)).text

        if etcdhealty != "ok":
            # etcd health status, 1 is error
            etcdHealthStr = 'etcd_current_status_error {0}\n'.format(1)
            logger.error(etcdHealthStr)
            outputFile.write(etcdHealthStr)
    except:
        exception = sys.exc_info()
        for e in exception:
            logger.error("watchdog error {}".format(e))
        # etcd health status, 1 is error
        etcdHealthStr = 'etcd_current_status_error {0}\n'.format(1)
        logger.error(etcdHealthStr)
        outputFile.write(etcdHealthStr)

    # 3. check kubelet
    nodeItems = nodesJsonObject["items"]
    kubeletErrorCount = 0

    for name in nodeItems:
        try:
            ip = name["metadata"]["name"]
            kubeletHealthy = requests.get("http://{}:{}/healthz".format(ip, 10255)).text

            if kubeletHealthy != "ok":
                # each node kubelet health status, 1 is error
                kubeletHealthStr = "kubelet_current_status_error{{node=\"{}\"}} {}\n".format(ip, 1)
                logger.error(kubeletHealthStr)
                outputFile.write(kubeletHealthStr)
                kubeletErrorCount += 1
        except:
            exception = sys.exc_info()
            for e in exception:
                logger.error("watchdog error {}".format(e))
            kubeletHealthStr = "kubelet_current_status_error{{node=\"{}\"}} {}\n".format(ip, 1)
            logger.error(kubeletHealthStr)
            outputFile.write(kubeletHealthStr)
            kubeletErrorCount += 1

    # error total count of node kubelet health status
    status = 'current_status_error_kubelet_count {0}\n'.format(kubeletErrorCount)
    outputFile.write(status)
    return

def parse_nodes_status(nodesJsonObject, outputFile):
    # check node status
    nodeItems = nodesJsonObject["items"]
    readyNodeCount = 0
    dockerError = 0

    for name in nodeItems:
        # 1. check each node status
        for condition in name["status"]["conditions"]:
            if "Ready" == condition["type"]:
                readyStatus = condition["status"]
                if readyStatus != "True":
                    # node status, value 1 is error
                    nodeHealthStr = "node_current_notready{{node=\"{}\"}} {}\n".format(name["metadata"]["name"], 1)
                    logger.info(nodeHealthStr)
                else:
                    readyNodeCount += 1
    # all nodes not ready count
    nodeNotReadyCount = 'notready_node_count {0}\n'.format(len(nodeItems) - readyNodeCount)
    logger.info("{}".format(nodeNotReadyCount))
    outputFile.write(nodeNotReadyCount)
    return

# check docker daemon health
def check_docker_daemon_status(outputFile, configFilePath):
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
    # execute cmd to check health
    cmd = "sudo systemctl is-active docker | if [ $? -eq 0 ]; then echo \"active\"; else exit 1 ; fi"
    errorNodeCout = 0
    for node_config in node_configs:
        try:
            if "username" not in node_config or "password" not in node_config or "sshport" not in node_config:
                node_config["username"] = username
                node_config["password"] = password
                node_config["port"] = port

            flag = common.ssh_shell_paramiko(node_config, cmd)
            if not flag:
                errorNodeCout += 1
                # single node docker health
                logger.error("node_current_docker_error{{instance=\"{}\"}} {}\n".format(node_config["hostip"], 1))
        except:
            exception = sys.exc_info()
            for e in exception:
                logger.error("watchdog error {}".format(e))
            errorNodeCout += 1
            # single node docker health
            logger.error("node_current_docker_error{{instance=\"{}\"}} {}\n".format(node_config["hostip"], 1))

    if errorNodeCout > 0:
        # aggregate all nodes docker health total count
        logger.error("docker_error_node_count {}\n".format(errorNodeCout))
    outputFile.write("docker_error_node_count {}\n".format(errorNodeCout))

def main(argv):
    logDir = argv[0]
    configFilePath = argv[1]
    timeSleep = int(argv[2])
    address = os.environ["K8S_API_SERVER_URI"]

    # init the logger
    loggerCommon.propagate = False
    logger.setLevel(logging.INFO)
    logger.propagate = False
    fileHandler = RotatingFileHandler(logDir + "/watchdog.log", maxBytes= 1024 * 1024 * 100, backupCount=5)
    fileHandler.setLevel(logging.INFO)
    formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    fileHandler.setFormatter(formatter)
    logger.addHandler(fileHandler)

    loggerRoot.setLevel(logging.INFO)
    loggerRoot.propagate = False
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    # create formatter and add it to the handlers
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    ch.setFormatter(formatter)
    loggerRoot.addHandler(ch)
    loggerRoot.info("k8s does not rotate log for container, Ref Link: https://kubernetes.io/docs/concepts/cluster-administration/logging/")
    loggerRoot.info("Watchdog container will output log to a log rotate file")
    loggerRoot.info("Rotate File Setting: ")
    loggerRoot.info("maxBytes= 1024 * 1024 * 100")
    loggerRoot.info("backupCount=5")
    loggerRoot.info("Log path {}/watchdog.log".format(logDir))

    while True:
        try:
            outputFile = open(logDir + "/watchdog.prom", "w")
            # 1. check service level status
            podsStatus = requests.get("{}/api/v1/namespaces/default/pods/".format(address)).json()
            parse_pods_status(podsStatus, outputFile)

            # 2. check nodes level status
            nodesStatus = requests.get("{}/api/v1/nodes/".format(address)).json()
            parse_nodes_status(nodesStatus, outputFile)
            # check docker deamon status
            check_docker_daemon_status(outputFile, configFilePath)

            # 3. check k8s level status
            check_k8s_componentStaus(address, nodesStatus, outputFile)
        except:
            exception = sys.exc_info()
            for e in exception:
                logger.error("watchdog error {}".format(e))
        time.sleep(timeSleep)

# python watch_dog.py /datastorage/prometheus /usr/local/cluster-configuration.yaml 3
# requires env K8S_API_SERVER_URI set to correct value, eg. http://10.151.40.133:8080
if __name__ == "__main__":
    main(sys.argv[1:])
