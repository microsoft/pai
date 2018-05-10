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
import logging  
from logging.handlers import RotatingFileHandler
import os

logger = logging.getLogger("node_exporter probe")  
logger.setLevel(logging.INFO)  
fileHandler = RotatingFileHandler("/datastorage/prometheus/node_exporter_probe.log", maxBytes= 1024 * 1024 * 100, backupCount=5)  
fileHandler.setLevel(logging.INFO)  
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")  
fileHandler.setFormatter(formatter)  
logger.addHandler(fileHandler)  

def main():
    runTimeException = []
    gpuExists = False
    try:
        gpuCheckCMD = "lspci | grep -E \"[0-9a-fA-F][0-9a-fA-F]:[0-9a-fA-F][0-9a-fA-F].[0-9] (3D|VGA compatible) controller: NVIDIA Corporation*\""
        gpuOutput = subprocess.check_output([gpuCheckCMD], shell=True)
        if gpuOutput:
            gpuExists = True
    except subprocess.CalledProcessError as e:
        err = "command '{}' return with error (code {}): {}".format(e.cmd, e.returncode, e.output)
        shortErr = "lspci"
        runTimeException.append(shortErr)
        logger.error(err)

    if gpuExists:
        try:
            env =  os.getenv("NV_DRIVER")
            if not env:
                nvidiaCMD= "nvidia-smi -q -x"
                smiOutput = subprocess.check_output([nvidiaCMD], shell=True)
            else:
                err = "nvidia env is null"
                runTimeException.append(err)
        except subprocess.CalledProcessError as e:
            err = "command '{}' return with error (code {}): {}".format(e.cmd, e.returncode, e.output)
            shortErr = "nvidiasmi"
            runTimeException.append(shortErr)
            logger.error(err)

    try:
        dockerInspectCMD = "docker inspect --help" 
        dockerDockerInspect = subprocess.check_output([dockerInspectCMD], shell=True)
    except subprocess.CalledProcessError as e:
        err = "command '{}' return with error (code {}): {}".format(e.cmd, e.returncode, e.output)
        shortErr = "dockerinspect"
        runTimeException.append(shortErr)
        logger.error(err)

    try:
        dockerStatsCMD = "docker stats --no-stream --format \"table {{.Container}}, {{.CPUPerc}},{{.MemUsage}},{{.NetIO}},{{.BlockIO}},{{.MemPerc}}\""
        dockerDockerStats = subprocess.check_output([dockerStatsCMD], shell=True)
    except subprocess.CalledProcessError as e:
        err = "command '{}' return with error (code {}): {}".format(e.cmd, e.returncode, e.output)
        shortErr = "dockerstats"
        runTimeException.append(shortErr)
        logger.error(err)

    if not os.path.exists("/datastorage/prometheus/gpu_exporter.prom"):
        err = "/datastorage/prometheus/gpu_exporter.prom does not exists"
        shortErr = "gpulogfile"
        runTimeException.append(shortErr)
        logger.error(err)

    if not os.path.exists("/datastorage/prometheus/job_exporter.prom"):
        err = "/datastorage/prometheus/job_exporter.prom does not exists"
        shortErr = "joblogfile"
        runTimeException.append(shortErr)
        logger.error(err)

    if len(runTimeException) > 0:
        exception = ""
        for e in runTimeException:
            exception += "| " + e
        raise RuntimeError("gpu-exporter readiness probe failed, error component:" + exception)

if __name__ == "__main__":
    main()