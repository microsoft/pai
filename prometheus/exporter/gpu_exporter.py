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
import sys
from xml.dom import minidom
import os

def parseSmiXmlResult(smi, logDir):
    xmldoc = minidom.parseString(smi)
    gpuList = xmldoc.getElementsByTagName('gpu')
    print(len(gpuList))
    gpu_count = len(gpuList)
    print("gpu numbers" + str(gpu_count))
    nvidiasmi_attached_gpus = "nvidiasmi_attached_gpus {0}\n".format(gpu_count)
    outputFile = open(logDir + "/gpu_exporter.prom", "w")
    outputFile.write(nvidiasmi_attached_gpus)
    outPut = {}
    for gpu in gpuList:
        minorNumber = gpu.getElementsByTagName('minor_number')[0].childNodes[0].data
        gpuUtil = gpu.getElementsByTagName('utilization')[0].getElementsByTagName('gpu_util')[0].childNodes[0].data.replace("%", "").strip()
        gpuMemUtil = gpu.getElementsByTagName('utilization')[0].getElementsByTagName('memory_util')[0].childNodes[0].data.replace("%", "").strip()
        gpuUtilStr = 'nvidiasmi_utilization_gpu{{minor_number=\"{0}\"}} {1}\n'.format(minorNumber, gpuUtil)
        MemUtilStr = 'nvidiasmi_utilization_memory{{minor_number=\"{0}\"}} {1}\n'.format(minorNumber, gpuMemUtil)
        outputFile.write(gpuUtilStr)
        outputFile.write(MemUtilStr)
        outPut[str(minorNumber)] = {"gpuUtil": gpuUtil, "gpuMemUtil": gpuMemUtil}
    return outPut

def genGpuMetricsFromSmi(logDir):
    try:
        cmd = "nvidia-smi -q -x"
        smi_output = subprocess.check_output([cmd], shell=True)
        return parseSmiXmlResult(smi_output, logDir)
    except subprocess.CalledProcessError as e:
        if e.returncode == 127:
            print("nvidia cmd error. command '{}' return with error (code {}): {}".format(e.cmd, e.returncode, e.output))
        else:
            print("command '{}' return with error (code {}): {}".format(e.cmd, e.returncode, e.output))

def main(argv):
    logDir = argv[0]
    genGpuMetricsFromSmi(logDir)

if __name__ == "__main__":
    main(sys.argv[1:])
