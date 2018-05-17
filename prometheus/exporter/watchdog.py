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

import subprocess
import json
import sys
import requests
import logging  
from logging.handlers import RotatingFileHandler
import time

logger = logging.getLogger("watchdog")  

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
    pod_container_status_restarted_pod_count = 0 # if one pod restarts > 1, add 1 to this metrics
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
            # specific pod occurs readiness probe failed error, condition is not ready
            logger.error("kube_pod_status_probe_not_ready{{pod=\"{}\"}} {}\n".format(pod["metadata"]["name"], 1))
            service.kube_pod_status_probe_not_ready += 1
        # 2. check failed phase pods
        if phase == "Failed":
            kube_pod_status_phase_failed += 1
            # specific pod phase become faile
            logger.error("kube_pod_status_phase_failed{{pod=\"{0}\"}} {1}\n".format(pod["metadata"]["name"], 1))
            service.kube_pod_status_phase_failed += 1

        # 3. check unknown phase pods 
        if phase == "Unknown":
            kube_pod_status_phase_unknown += 1
            # specific pod phase become unknown
            logger.error("kube_pod_status_phase_unknown{{pod=\"{0}\"}} {1}\n".format(pod["metadata"]["name"], 1))
            service.kube_pod_status_phase_unknown += 1

        containerStatus = status["containerStatuses"]

        # 4. check pod containers running/waiting/terminated status
        for perContainerStatus in containerStatus:
            containerReady = perContainerStatus["ready"]
            restartCount = perContainerStatus["restartCount"]
            if not containerReady:
                pod_container_status_not_ready +=1 
                # specific pod contains container status is not ready
                logger.error("pod_container_status_not_ready{{pod=\"{0}\", container=\"{1}\"}} {2}\n".format(pod["metadata"]["name"], perContainerStatus["name"], 1))
                service.pod_container_status_not_ready += 1

            state = perContainerStatus["state"]
            if "terminated" in state:
                pod_container_status_terminated += 1
                # specific pod container status is terminated total count
                logger.error("pod_container_status_terminated{{pod=\"{0}\", container=\"{1}\"}} {2}\n".format(pod["metadata"]["name"], perContainerStatus["name"], 1))
                service.pod_container_status_terminated += 1

            if "waiting" in state:
                pod_container_status_waiting += 1
                # specific pod container status is waiting  total count
                logger.error("pod_container_status_waiting{{pod=\"{0}\", container=\"{1}\"}} {2}\n".format(pod["metadata"]["name"], perContainerStatus["name"], 1))
                service.pod_container_status_waiting += 1

            if restartCount > 0:
                pod_container_status_restarted_pod_count += 1
                # specific pod's container restart total count
                logger.error("pod_container_status_restart_total{{pod=\"{0}\", container=\"{1}\"}} {2}\n".format(pod["metadata"]["name"], perContainerStatus["name"], restartCount))
                service.pod_container_status_restart_total += 1

    # service level aggregation metrics
    for service in serviceMetrics:
        # each service occurs readiness probe failed error, condition is not ready, total count
        logger.error("kube_service_status_probe_not_ready{{service=\"{}\"}} {}\n".format(service.name, service.kube_pod_status_probe_not_ready))
        # all pods' phase become faile total count
        logger.error("kube_service_status_phase_failed{{service=\"{}\"}} {}\n".format(service.name, service.kube_pod_status_phase_failed))
        # all pods' phase become unknown total count
        logger.error("kube_service_status_phase_unknown{{service=\"{}\"}} {}\n".format(service.name, service.kube_pod_status_phase_unknown))
        # all pods' contains container status is not ready total count
        logger.error("service_container_status_not_ready{{service=\"{}\"}} {}\n".format(service.name, service.pod_container_status_waiting))
        # all pods' container status is terminated total count
        logger.error("service_container_status_terminated{{service=\"{}\"}} {}\n".format(service.name, service.pod_container_status_terminated))
        # all pods' container status is waiting  total count
        logger.error("service_container_status_waiting{{service=\"{}\"}} {}\n".format(service.name, service.pod_container_status_not_ready))
        # all pods' container restart total count
        logger.error("service_container_status_restart_total{{service=\"{}\"}} {}\n".format(service.name, service.pod_container_status_restart_total))
    
    # aggregate whole cluster level service metrics
    # all pods' occurs readiness probe failed error, condition is not ready, total count
    outputFile.write("kube_pod_status_probe_not_ready_total {}\n".format(kube_pod_status_probe_not_ready))
    # all pods' phase become faile total count
    outputFile.write("kube_pod_status_phase_failed_total {}\n".format(kube_pod_status_phase_failed))
    # all pods' phase become unknown total count
    outputFile.write("kube_pod_status_phase_unknown_total {}\n".format(kube_pod_status_phase_unknown))
    # all pods' contains container status is not ready total count
    outputFile.write("pod_container_status_not_ready_total {}\n".format(pod_container_status_not_ready))
    # all pods' container status is terminated total count
    outputFile.write("pod_container_status_terminated_total {}\n".format(pod_container_status_terminated))
    # all pods' container status is waiting  total count
    outputFile.write("pod_container_status_waiting_total {}\n".format(pod_container_status_waiting))
    # all pods' container restart total count
    outputFile.write("pod_container_status_restarted_pod_count_total {}\n".format(pod_container_status_restarted_pod_count))

    logger.info("kube_pod_status_probe_not_ready_total {}\n".format(kube_pod_status_probe_not_ready))
    logger.info("kube_pod_status_phase_failed_total {}\n".format(kube_pod_status_phase_failed))
    logger.info("kube_pod_status_phase_unknown_total {}\n".format(kube_pod_status_phase_unknown))
    logger.info("pod_container_status_not_ready_total {}\n".format(pod_container_status_not_ready))
    logger.info("pod_container_status_terminated_total {}\n".format(pod_container_status_terminated))
    logger.info("pod_container_status_waiting_total {}\n".format(pod_container_status_waiting))
    logger.info("pod_container_status_restarted_pod_count_total {}\n".format(pod_container_status_restarted_pod_count))
    return

def check_k8s_componentStaus(address, nodesJsonObject, outputFile):
    # 1. check api server
    apiServerhealty = requests.get("{}/healthz".format(address)).text
    status = 1
    if apiServerhealty != "ok":
        logger.info("apiserver status error, status code{}".format(apiServerhealty))
        status = 0
    # api server health status, ok is active, others are error    
    status = 'watchdog_apiserver_status {0}\n'.format(status)
    # api server health status, 1 is active, others are error    
    outputFile.write(status)

    # 2. check etcd
    etcdhealty = requests.get("{}/healthz/etcd".format(address)).text
    status = 1
    if etcdhealty != "ok":
        # etcd health status, ok is active, others are error
        logger.info("etcd status error, status code{}".format(etcdhealty))
        status = 0
    # etcd health status, 1 is active, others are error
    status = 'watchdog_etcd_status {0}\n'.format(status)
    outputFile.write(status)
    # 3. check kubelet
    nodeItems = nodesJsonObject["items"]
    kubeletErrorCount = 0
    
    for name in nodeItems:
        ip = name["metadata"]["name"]
        kubeletHealthy = requests.get("http://{}:{}/healthz".format(ip, 10255)).text

        if kubeletHealthy != "ok":
            # each node kubelet health status, ok is active, others are error
            logger.info("kubelet {} status error, status code{}".format(ip, kubeletHealthy))
            kubeletErrorCount += 1
    # each node kubelet health status ok / error total count
    status = 'watchdog_kubelet_status_ok {0}\n'.format(len(nodeItems) - kubeletErrorCount)
    status = 'watchdog_kubelet_status_error {0}\n'.format(kubeletErrorCount)
    outputFile.write(status)
    return 

def parse_nodes_status(nodesJsonObject, outputFile):
    nodeItems = nodesJsonObject["items"]
    readyNodeCount = 0
    dockerError = 0

    for name in nodeItems:
        # 1. check each node status
        for condition in name["status"]["conditions"]:
            if "Ready" == condition["type"]:
                readyStatus = condition["status"]
                if readyStatus != "True":
                    # node status, Ready is active, others are error
                    logger.info("node {} is not ready, condition is {}".format(name["metadata"]["name"], readyStatus))
                else: 
                    readyNodeCount += 1
    # all nodes ready / not ready count
    nodeReadyCount = 'watchdog_node_ready_count {0}\n'.format(readyNodeCount)
    nodeNotReadyCount = 'watchdog_node_notready_count {0}\n'.format(len(nodeItems) - readyNodeCount)
    logger.info("{}".format(nodeReadyCount))
    logger.info("{}".format(nodeNotReadyCount))
    outputFile.write(nodeReadyCount)
    outputFile.write(nodeNotReadyCount)
    return

def main(argv):
    logDir = argv[0]
    timeSleep = int(argv[1])
    address = argv[2]
    # init the logger
    logger.setLevel(logging.INFO)  
    logger.propagate = False
    fileHandler = RotatingFileHandler(logDir + "/watchdog.log", maxBytes= 1024 * 1024 * 100, backupCount=5)  
    fileHandler.setLevel(logging.INFO)  
    consoleHandler = logging.StreamHandler()  
    consoleHandler.setLevel(logging.INFO)  
    formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")  
    consoleHandler.setFormatter(formatter)  
    fileHandler.setFormatter(formatter)  
    logger.addHandler(consoleHandler)  
    logger.addHandler(fileHandler)  
    outputFile = open(logDir + "/watchdog.prom", "w")
    while(True):
        try:
            # 1. check service level status
            podsStatus = requests.get("{}/api/v1/namespaces/default/pods/".format(address)).json()
            parse_pods_status(podsStatus, outputFile)

            # 2. check nodes level status
            nodesStatus = requests.get("{}/api/v1/nodes/".format(address)).json()
            parse_nodes_status(nodesStatus, outputFile)

            # 3. check k8s level status
            check_k8s_componentStaus(address, nodesStatus, outputFile)
        except:
            exception = sys.exc_info()
            for e in exception:
                logger.error("watchdog error {}".format(e))
        time.sleep(timeSleep)

# python watch_dog.py /data/prometheus 10 10.151.40.234 8080
if __name__ == "__main__":
    main(sys.argv[1:])