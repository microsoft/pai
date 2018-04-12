#!/usr/bin/python
import subprocess
import json
import sys
import docker_stats
import docker_inspect
import gpu_exporter
import time

def parseFromLabels(labels): 
    gpuIds = []
    labelStr = ""

    for label in labels:
        if "PAI_CURRENT_GPU_ID" in label:
            s1 = label.split("=")
            if len(s1) > 1:
                s2 = s1[1].replace("\"", "").split(",")
                for id in s2:
                    gpuIds.append(id)
        else: 
            continue
        labelStr += label + ","

    return gpuIds, labelStr

def parseFromEnv(envs): 
    envStr = ""

    for env in envs:
        envStr += env + ","

    return envStr

def genJobMetrics(logDir, gpuMetrics):
    stats = docker_stats.stats()
    outputFile = open(logDir + "/job_exporter.prom", "w")
    for container in stats:
        inspectInfo = docker_inspect.inspect(container)
        if not inspectInfo["labels"]:
            continue
        gpuIds, labelStr = parseFromLabels(inspectInfo["labels"])
        envStr = parseFromEnv(inspectInfo["env"])
        labelStr = labelStr + envStr
        for id in gpuIds:
            containerGpuUtilStr = 'container_GPUPerc{{{0}minor_number=\"{1}\"}} {2}\n'.format(labelStr, id, gpuMetrics[id]["gpuUtil"])
            containerMemUtilStr = 'container_GPUMemPerc{{{0}minor_number=\"{1}\"}} {2}\n'.format(labelStr, id, gpuMetrics[id]["gpuMemUtil"])
            outputFile.write(containerGpuUtilStr)
            outputFile.write(containerMemUtilStr)

        containerCPUPerc = 'container_CPUPerc{{{0}}} {1}\n'.format(labelStr, stats[container]["CPUPerc"])
        containerMemUsage = 'container_MemUsage{{{0}}} {1}\n'.format(labelStr, stats[container]["MemUsage_Limit"]["usage"])
        containerMemLimit = 'container_MemLimit{{{0}}} {1}\n'.format(labelStr, stats[container]["MemUsage_Limit"]["limit"])
        containerNetIn = 'container_NetIn{{{0}}} {1}\n'.format(labelStr, stats[container]["NetIO"]["in"])
        containerNetOut = 'container_NetOut{{{0}}} {1}\n'.format(labelStr, stats[container]["NetIO"]["out"])
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
    while(True):
        logDir = argv[0]
        timeSleep = int(argv[1])
        # collect GPU metrics
        gpuMetrics = gpu_exporter.main([logDir])
        # join with docker stats metrics and docker inspect labels
        genJobMetrics(logDir, gpuMetrics)
        time.sleep(timeSleep)

# example: python job_exporter.py ./datastorage/prometheus 3
if __name__ == "__main__":
    main(sys.argv[1:])