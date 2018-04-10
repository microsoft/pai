#!/usr/bin/python
import subprocess
import json
import sys
import re

def parsePercentile(data):
    return data.replace("%", "")

def parseIO(data):
    inOut = data.split("/")
    inByte = convertToByte(inOut[0])
    outByte = convertToByte(inOut[1])
    return {"in": inByte, "out": outByte}

def parseUsageLimit(data):
    usageLimit = data.split("/")
    usageByte = convertToByte(usageLimit[0])
    limitByte = convertToByte(usageLimit[1])
    return {"usage": usageByte, "limit": limitByte}

def convertToByte(data):
    data = data.lower()
    number = float(re.findall(r"\d", data)[0])
    if ("tb" in data) or ("tib" in data):
        return number * 1024 * 1024 * 1024 * 1024
    elif ("gb" in data) or ("gib" in data):
        return number * 1024 * 1024 * 1024
    elif ("mb" in data) or ("mib" in data):
        return number * 1024 * 1024
    elif ("kb" in data) or ("kib" in data):
        return number * 1024
    else: 
        return number

def parseDockerStats(stats):
    data = [line.split(',') for line in stats.splitlines()]
    # pop the headers
    data.pop(0)
    rowNum = len(data)
    colNum = len(data[0])
    containerStats = {}

    for i in range(rowNum):
        id = data[i][0]
        containerInfo = {
            "id": data[i][0],
            "CPUPerc": parsePercentile(data[i][1]),
            "MemUsage_Limit": parseUsageLimit(data[i][2]),
            "NetIO": parseIO(data[i][3]),
            "BlockIO": parseIO(data[i][4]),
            "MemPerc": parsePercentile(data[i][5])
        }
        containerStats[id] = containerInfo
    return containerStats
    
def stats(argv):
    
    try:
        dockerStatsCMD = "sudo docker stats --no-stream --format \"table {{.ID}}, {{.CPUPerc}},{{.MemUsage}},{{.NetIO}},{{.BlockIO}},{{.MemPerc}}\""
        dockerDockerStats = subprocess.check_output([dockerStatsCMD])
        dockerStats = parseDockerStats(dockerDockerStats)
        return dockerStats
    except subprocess.CalledProcessError as e:
            raise RuntimeError("command '{}' return with error (code {}): {}".format(e.cmd, e.returncode, e.output))

# execute cmd example: python .\docker_stats.py 
if __name__ == "__main__":
    stats(sys.argv[1:])