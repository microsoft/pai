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
import docker_stats
import docker_inspect
import gpu_exporter
import time
import logging  
import network
from logging.handlers import RotatingFileHandler

logger = logging.getLogger("gpu_expoter")  
logger.setLevel(logging.INFO)  
fh = RotatingFileHandler("/datastorage/prometheus/gpu_exporter.log", maxBytes= 1024 * 1024 * 10, backupCount=5)  
fh.setLevel(logging.INFO) 
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")  
fh.setFormatter(formatter)   
logger.addHandler(fh)

def parse_from_labels(labels):
    gpuIds = []
    labelStr = ""

    for label in labels:
        logger.info(label)
        if "container_label_GPU_ID" in label:
            s1 = label.split("=")
            if len(s1) > 1:
                s2 = s1[1].replace("\"", "").split(",")
                for id in s2:
                    if id:
                        gpuIds.append(id)
        else:
            labelStr += label + ","


    return gpuIds, labelStr

def parse_from_env(envs):
    envStr = ""

    for env in envs:
        envStr += env + ","

    return envStr

def gen_job_metrics(logDir, gpuMetrics, connectionDic):
    stats = docker_stats.stats()
    outputFile = open(logDir + "/job_exporter.prom", "w")
    for container in stats:
        inspectInfo = docker_inspect.inspect(container)
        if not inspectInfo["labels"]:
            continue
        pid = inspectInfo["pid"]
        gpuIds, labelStr = parse_from_labels(inspectInfo["labels"])
        envStr = parse_from_env(inspectInfo["env"])
        labelStr = labelStr + envStr
        for id in gpuIds:
            if gpuMetrics:
                logger.info(gpuMetrics)
                containerGpuUtilStr = 'container_GPUPerc{{{0}minor_number=\"{1}\"}} {2}\n'.format(labelStr, id, gpuMetrics[id]["gpuUtil"])
                containerMemUtilStr = 'container_GPUMemPerc{{{0}minor_number=\"{1}\"}} {2}\n'.format(labelStr, id, gpuMetrics[id]["gpuMemUtil"])
                outputFile.write(containerGpuUtilStr)
                outputFile.write(containerMemUtilStr)

        containerCPUPerc = 'container_CPUPerc{{{0}}} {1}\n'.format(labelStr, stats[container]["CPUPerc"])
        containerMemUsage = 'container_MemUsage{{{0}}} {1}\n'.format(labelStr, stats[container]["MemUsage_Limit"]["usage"])
        containerMemLimit = 'container_MemLimit{{{0}}} {1}\n'.format(labelStr, stats[container]["MemUsage_Limit"]["limit"])
        inSize, outSize = network.acc_per_container_network_metrics(connectionDic, pid)
        containerNetIn = 'container_NetIn{{{0}}} {1}\n'.format(labelStr, inSize)
        containerNetOut = 'container_NetOut{{{0}}} {1}\n'.format(labelStr, outSize)
        containerBlockIn = 'container_BlockIn{{{0}}} {1}\n'.format(labelStr, stats[container]["BlockIO"]["in"])
        containerBlockOut = 'container_BlockOut{{{0}}} {1}\n'.format(labelStr, stats[container]["BlockIO"]["out"])
        containerMemPerc = 'container_MemPerc{{{0}}} {1}\n'.format(labelStr, stats[container]["MemPerc"])
        outputFile.write(containerCPUPerc)
        outputFile.write(containerMemUsage)
        outputFile.write(containerMemLimit)
        outputFile.write(containerNetIn)
        outputFile.write(containerNetOut)
        outputFile.write(containerBlockIn)
        outputFile.write(containerBlockOut)
        outputFile.write(containerMemPerc)

def main(argv):
    logDir = argv[0]
    timeSleep = int(argv[1])
    iter = 0
    while(True):
        try:
            logger.info("job exporter running {0} iteration".format(str(iter)))
            iter += 1
            # collect GPU metrics
            gpuMetrics = gpu_exporter.gen_gpu_metrics_from_smi(logDir)
            # collection connection metrics
            connectionDic = iftop()
            # join with docker stats metrics and docker inspect labels
            gen_job_metrics(logDir, gpuMetrics, connectionDic)
        except:
            exception = sys.exc_info()
            for e in exception:
                logger.error("job exporter error {}".format(e))
        time.sleep(timeSleep)


if __name__ == "__main__":
    main(sys.argv[1:])
