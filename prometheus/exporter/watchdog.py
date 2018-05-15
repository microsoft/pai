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
    podTotalCount = podsJsonObject["items"]  
    for pod in podItems:
        # all / per pod phase failed/unkown/Not ready (condition) 
        status = pod["status"]
        phase = status["phase"]
        conditions = status["conditions"]
        ready = "True"
        init = "True"
        scheduled = "True"
        # check not ready
        for condition in conditions:
            if condition["type"] == "Ready":
                ready = condition["status"]
            elif condition["type"] == "Initialized":
                init = condition["status"]
            elif condition["type"] == "PodScheduled":
                scheduled = condition["status"]    

        if ready != "True" and init == "True" and scheduled == "True":
            kube_pod_status_probe_not_ready += 1
            logger.error("kube_pod_status_probe_not_ready{{pod=\"{0}\"}} {1}\n".format(pod["metadata"]["name"], 1))
        # check failed
        if phase == "Failed":
            kube_pod_status_phase_failed += 1
            logger.error("kube_pod_status_phase_failed{{pod=\"{0}\"}} {1}\n".format(pod["metadata"]["name"], 1))
        # check unknown 
        if phase == "Unknown":
            kube_pod_status_phase_unknown += 1
            logger.error("kube_pod_status_phase_unknown{{pod=\"{0}\"}} {1}\n".format(pod["metadata"]["name"], 1))
        containerStatus = status["containerStatuses"]

        # all / per pod containers running/waiting/terminated
        for perContainerStatus in containerStatus:
            containerReady = perContainerStatus["ready"]
            restartCount = perContainerStatus["restartCount"]
            if not containerReady:
                pod_container_status_not_ready +=1 
                logger.error("pod_container_status_not_ready{{pod=\"{0}\", container=\"{1}\"}} {2}\n".format(pod["metadata"]["name"], perContainerStatus["name"], 1))

            state = perContainerStatus["state"]
            if "terminated" in state:
                pod_container_status_terminated += 1
                logger.error("pod_container_status_terminated{{pod=\"{0}\", container=\"{1}\"}} {2}\n".format(pod["metadata"]["name"], perContainerStatus["name"], 1))

            if "waiting" in state:
                pod_container_status_waiting += 1
                logger.error("pod_container_status_waiting{{pod=\"{0}\", container=\"{1}\"}} {2}\n".format(pod["metadata"]["name"], perContainerStatus["name"], 1))
            
            if restartCount > 0:
                pod_container_status_restarted_pod_count += 1
                logger.error("pod_container_status_restart_total{{pod=\"{0}\", container=\"{1}\"}} {2}\n".format(pod["metadata"]["name"], perContainerStatus["name"], restartCount))
            
    
    outputFile.write("kube_pod_status_probe_not_ready {}\n".format(kube_pod_status_probe_not_ready))
    outputFile.write("kube_pod_status_phase_failed {}\n".format(kube_pod_status_phase_failed))
    outputFile.write("kube_pod_status_phase_unknown {}\n".format(kube_pod_status_phase_unknown))
    outputFile.write("pod_container_status_not_ready {}\n".format(pod_container_status_not_ready))
    outputFile.write("pod_container_status_terminated {}\n".format(pod_container_status_terminated))
    outputFile.write("pod_container_status_waiting {}\n".format(pod_container_status_waiting))
    outputFile.write("pod_container_status_restarted_pod_count {}\n".format(pod_container_status_restarted_pod_count))

    return

def check_k8s_componentStaus(ip, port, nodesJsonObject, outputFile):
    # check api server
    apiServerhealty = requests.get("http://{}:{}/healthz".format(ip, port)).text
    logger.info(apiServerhealty)
    status = 1
    if apiServerhealty != "ok":
        logger.info("apiserver status error, status code{}".format(apiServerhealty))
        status = 0
        
    status = 'watchdog_apiserver_status {0}\n'.format(status)
    outputFile.write(status)

    # check etcd
    etcdhealty = requests.get("http://{}:{}/healthz/etcd".format(ip, port)).text
    status = 1
    if etcdhealty != "ok":
        logger.info("etcd status error, status code{}".format( etcdhealty))
        status = 0
        
    status = 'watchdog_etcd_status {0}\n'.format(status)
    outputFile.write(status)

    # check kubelet
    nodeItems = nodesJsonObject["items"]
    kubeletErrorCount = 0
    
    for name in nodeItems:
        ip = name["metadata"]["name"]
        kubeletHealthy = requests.get("http://{}:{}/healthz".format(ip, 10255)).text

        if kubeletHealthy != "ok":
            logger.info("kubelet {} status error, status code{}".format(ip, kubeletHealthy))
            kubeletErrorCount += 1
        
    status = 'watchdog_kubelet_status_ok {0}\n'.format(len(nodeItems) - kubeletErrorCount)
    status = 'watchdog_kubelet_status_error {0}\n'.format(kubeletErrorCount)
    outputFile.write(status)
    return 

def parse_nodes_status(nodesJsonObject, outputFile):
    nodeItems = nodesJsonObject["items"]
    readyNodeCount = 0
    dockerError = 0

    for name in nodeItems:
        # check node
        for condition in name["status"]["conditions"]:
            if "Ready" == condition["type"]:
                readyStatus = condition["status"]
                if readyStatus != "True":
                    logger.info("node {} is not ready, condition is {}".format(name["metadata"]["name"], readyStatus))
                else: 
                    readyNodeCount += 1

        # check docker deamon
        dockerHealthy = requests.get("http://{}:{}/api/v2.1/ps".format(name["metadata"]["name"], 4194)).status_code
        if dockerHealthy != 200:
            logger.info("docker {} status error, status code{}".format(name["metadata"]["name"], dockerHealthy))
            dockerError += 1


    nodeReadyCount = 'watchdog_node_ready_count {0}\n'.format(readyNodeCount)
    nodeNotReadyCount = 'watchdog_node_notready_count {0}\n'.format(len(nodeItems) - readyNodeCount)
    logger.info("{}".format(nodeReadyCount))
    logger.info("{}".format(nodeNotReadyCount))
    outputFile.write(nodeReadyCount)
    outputFile.write(nodeNotReadyCount)

    dockerStatusError = 'watchdog_docker_status_error_count {0}\n'.format(dockerError)
    dockerStatusReady = 'watchdog_docker_status_ready_count {0}\n'.format(len(nodeItems) - dockerError)
    outputFile.write(dockerStatusError)
    outputFile.write(dockerStatusReady)
    logger.info("{}".format(dockerStatusError))
    logger.info("{}".format(dockerStatusReady))
    return

def main(argv):
    logDir = argv[0]
    timeSleep = int(argv[1])
    ip = argv[2]
    port = argv[3]

    while(True):
        logger.setLevel(logging.INFO)  
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
  
        # 1. check service level status
        podsStatus = requests.get("http://{}:{}/api/v1/namespaces/default/pods/".format(ip, port)).json()
        parse_pods_status(podsStatus, outputFile)

        # 2. check nodes level status
        nodesStatus = requests.get("http://{}:{}/api/v1/nodes/".format(ip, port)).json()
        parse_nodes_status(nodesStatus, outputFile)

        # 3. check k8s level status
        check_k8s_componentStaus(ip, port, nodesStatus, outputFile)
        
        time.sleep(timeSleep)

# python watch_dog.py /data/prometheus 10 10.151.40.234 8080
if __name__ == "__main__":
    main(sys.argv[1:])
