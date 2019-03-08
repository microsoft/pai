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

import subprocess
import sys
import re
import logging

import utils

logger = logging.getLogger(__name__)

def parse_percentile(data):
    return float(data.replace("%", ""))

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
    number = float(re.findall(r"[0-9.]+", data)[0])
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
    data = [line.split(",") for line in stats.splitlines()]
    # pop the headers
    data.pop(0)
    row_count = len(data)
    container_stats = {}

    for i in range(row_count):
        id = data[i][0]
        containerInfo = {
            "id": data[i][0],
            "name": data[i][1],
            "CPUPerc": parse_percentile(data[i][2]),
            "MemUsage_Limit": parse_usage_limit(data[i][3]),
            "NetIO": parse_io(data[i][4]),
            "BlockIO": parse_io(data[i][5]),
            "MemPerc": parse_percentile(data[i][6])
        }
        container_stats[id] = containerInfo
    return container_stats

def stats(histogram, timeout):
    try:
        result = utils.exec_cmd([
            "docker", "stats", "--no-stream", "--format",
            "table {{.ID}},{{.Name}},{{.CPUPerc}},{{.MemUsage}},{{.NetIO}},{{.BlockIO}},{{.MemPerc}}"],
            histogram=histogram,
            timeout=timeout)
        return parse_docker_stats(result)
    except subprocess.CalledProcessError as e:
        logger.error("command '{}' return with error (code {}): {}".format(e.cmd, e.returncode, e.output))
    except subprocess.TimeoutExpired:
        logger.warning("docker stats timeout")
    except Exception:
        logger.exception("exec docker stats error")
