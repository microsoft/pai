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
import time

def convert_to_byte(data):
    number = float(re.findall(r"(\d+(\.\d+)?)", data)[0][0])
    if "T" in data:
        return number * 1024 * 1024 * 1024 * 1024
    elif "G" in data:
        return number * 1024 * 1024 * 1024
    elif "M" in data:
        return number * 1024 * 1024
    elif "K" in data:
        return number * 1024
    else: 
        return number

def parse_iftop(stats):
    connectionDic = {}
    data = [line.split(',') for line in stats.splitlines()]

    while True and len(data) > 0:
        item = data.pop(0)

        if len(item) > 0 and "------------" in item[0]:
            break

    index = 0

    while index < len(data):

        if len(data[index]) > 0 and "------------" in data[index][0]:
            break

        srcStr = data[index][0]
        desStr = data[index + 1][0]
        srcSplit = srcStr.split("B")
        desSplit = desStr.split("B")
        srcAddress = re.findall(r'[0-9]+(?:\.[0-9]+){3}:[0-9]+', srcSplit[0])
        srcIPPort = ""

        if len(srcAddress) > 0:
            srcIPPort = srcAddress[0]

        desAddress = re.findall(r'[0-9]+(?:\.[0-9]+){3}:[0-9]+', desSplit[0])
        desIPPort = ""

        if len(desAddress) > 0:
            desIPPort = desAddress[0]

        connection = srcIPPort + "|" + desIPPort
        lastOutDataSize = convert_to_byte(srcSplit[-3].strip())
        lastInDataSize = convert_to_byte(desSplit[-3].strip())
        connectionDic[connection] = {"inSize": lastInDataSize, "outSize": lastOutDataSize, "src": srcIPPort, "out": desIPPort}
        index += 2
    return connectionDic

def iftop():
    try:
        iftopCMD = "iftop -t -P -s 1 -L 10000 -B -n -N"
        iftopResult = subprocess.check_output([iftopCMD], shell=True)
        result = parse_iftop(iftopResult)
        return result
    except subprocess.CalledProcessError as e:
        raise RuntimeError("command '{}' return with error (code {}): {}".format(e.cmd, e.returncode, e.output))

def parse_lsof(stats):
    connections = {}
    data = stats.splitlines()
    data.pop(0)
    index = 0

    for ditem in data:
        srcDes = re.findall(r'[0-9]+(?:\.[0-9]+){3}:[0-9]+', ditem)
        srcStr = ""
        desStr = ""
        srcDesStr = ""

        if 2 == len(srcDes):
            srcStr = srcDes[0]
            desStr = srcDes[1]
            srcDesStr = srcStr + "|" + desStr
            connections[srcDesStr] = {"src": srcStr, "des": desStr}
    return connections

def lsof(containerPID):
    try:
        lsofCMD = "infilter {} /usr/bin/lsof -i -n".format(containerPID)
        isofResult = subprocess.check_output([lsofCMD], shell=True)
        result = parse_lsof(isofResult)
        return result
    except subprocess.CalledProcessError as e:
        raise RuntimeError("command '{}' return with error (code {}): {}".format(e.cmd, e.returncode, e.output))

def acc_per_container_network_metrics(connectionDic, pid):
    connections = lsof(pid)
    accInBytes = 0
    accOutBytes = 0

    for conn in connections:
        inBytes = 0
        outBytes = 0
        if conn in connectionDic:
            inBytes = connectionDic[conn]["inSize"]
            accInBytes += inBytes
        if conn in connectionDic:
            outBytes = connectionDic[conn]["outSize"]
            accOutBytes += outBytes
    return accInBytes, accOutBytes

def main(argv):
    timeSleep = 3
    iter = 0
    pid = [argv]
    while(True):
        connectionDic = iftop()
        for id in pid:
            print(id)
            inSize, outSize = acc_per_container_network_metrics(connectionDic, id)
            print("pid {}, results: inBytes{}, outBytes{}".format(id, inSize, outSize))
        time.sleep(timeSleep)

# execute cmd example: python .\network.py 
if __name__ == "__main__":
    main(sys.argv[1:])
