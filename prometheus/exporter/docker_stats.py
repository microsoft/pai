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
import re
import logging
logger = logging.getLogger("gpu_expoter")

def parse_percentile(data):
    return data.replace("%", "")

def parse_io(data):
    inOut = data.split("/")
    inByte = convert_to_byte(inOut[0])
    outByte = convert_to_byte(inOut[1])
    return {"in": inByte, "out": outByte}

def parse_usage_limit(data):
    usageLimit = data.split("/")
    usageByte = convert_to_byte(usageLimit[0])
    limitByte = convert_to_byte(usageLimit[1])
    return {"usage": usageByte, "limit": limitByte}

def convert_to_byte(data):
    data = data.lower()
    number = float(re.findall(r"\d+", data)[0])
    if "tb" in data:
        return number * 10 ** 12
    elif "gb" in data:
        return number * 10 ** 9
    elif "mb" in data:
        return number * 10 ** 6
    elif "kb" in data:
        return number * 10 ** 3
    elif "tib" in data:
        return number * 2 ** 40
    elif "gib" in data:
        return number * 2 ** 30
    elif "mib" in data:
        return number * 2 ** 20
    elif "kib" in data:
        return number * 2 ** 10
    else:
        return number

def parse_docker_stats(stats):
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
            "CPUPerc": parse_percentile(data[i][1]),
            "MemUsage_Limit": parse_usage_limit(data[i][2]),
            "NetIO": parse_io(data[i][3]),
            "BlockIO": parse_io(data[i][4]),
            "MemPerc": parse_percentile(data[i][5])
        }
        containerStats[id] = containerInfo
    return containerStats

def stats():
    try:
        dockerStatsCMD = "docker stats --no-stream --format \"table {{.Container}}, {{.CPUPerc}},{{.MemUsage}},{{.NetIO}},{{.BlockIO}},{{.MemPerc}}\""
        dockerDockerStats = subprocess.check_output([dockerStatsCMD], shell=True)
        dockerStats = parse_docker_stats(dockerDockerStats)
        return dockerStats
    except subprocess.CalledProcessError as e:
        logger.error("command '{}' return with error (code {}): {}".format(e.cmd, e.returncode, e.output))

def main(argv):
    stats()

# execute cmd example: python .\docker_stats.py True
if __name__ == "__main__":
    main(sys.argv[1:])
