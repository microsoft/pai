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
import re

import utils

logger = logging.getLogger(__name__)

def main():
    runTimeException = []
    gpuExists = False

    try:
        gpuOutput = utils.check_output(["lspci"])
        r = re.search("[0-9a-fA-F][0-9a-fA-F]:[0-9a-fA-F][0-9a-fA-F].[0-9] (3D|VGA compatible) controller: NVIDIA Corporation.*", gpuOutput, flags=0)
        if r is not None:
            gpuExists = True
    except subprocess.CalledProcessError as e:
        runTimeException.append("lspci")
        logger.error("command '%s' return with error (code %d): %s", e.cmd, e.returncode, e.output)

    if gpuExists:
        try:
            smiOutput = utils.check_output(["nvidia-smi", "-q", "-x"])
        except subprocess.CalledProcessError as e:
            runTimeException.append("nvidia-smi")
            logger.error("command '%s' return with error (code %d): %s", e.cmd, e.returncode, e.output)

    try:
        dockerDockerInspect = utils.check_output(["docker", "inspect", "--help"])
    except subprocess.CalledProcessError as e:
        runTimeException.append("docker_inspect")
        logger.error("command '%s' return with error (code %d): %s", e.cmd, e.returncode, e.output)

    try:
        dockerDockerStats = subprocess.check_output(["docker", "stats", "--no-stream", "--format",
            "table {{.Container}}, {{.CPUPerc}},{{.MemUsage}},{{.NetIO}},{{.BlockIO}},{{.MemPerc}}"])
    except subprocess.CalledProcessError as e:
        runTimeException.append("docker_stats")
        logger.error("command '%s' return with error (code %d): %s", e.cmd, e.returncode, e.output)

    if not os.path.exists("/datastorage/prometheus/job_exporter.prom"):
        runTimeException.append(joblogfile)
        logger.error("/datastorage/prometheus/job_exporter.prom does not exists")

    if len(runTimeException) > 0:
        exception = "| ".join(runTimeException)
        raise RuntimeError("gpu-exporter readiness probe failed, error component:" + exception)

if __name__ == "__main__":
    rootLogger = logging.getLogger()
    rootLogger.setLevel(logging.INFO)
    fh = RotatingFileHandler("/datastorage/prometheus/node_exporter_probe.log", maxBytes= 1024 * 1024 * 10, backupCount=5)
    fh.setLevel(logging.INFO)
    formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(filename)s:%(lineno)s - %(message)s")
    fh.setFormatter(formatter)
    rootLogger.addHandler(fh)

    main()
