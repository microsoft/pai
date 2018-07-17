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
import datetime
import logging

import utils

logger = logging.getLogger(__name__)

targetLabel = {"PAI_HOSTNAME", "PAI_JOB_NAME", "PAI_USER_NAME", "PAI_CURRENT_TASK_ROLE_NAME", "GPU_ID"}
targetEnv = {"PAI_TASK_INDEX"}

def parse_docker_inspect(jsonStr):
    jsonObject = json.loads(jsonStr)
    labels = {}
    envs = {}

    if jsonObject[0]["Config"]["Labels"]:
        for key in jsonObject[0]["Config"]["Labels"]:
            if key in targetLabel:
                labelKey = "container_label_{0}".formate(key.replace(".", "_"))
                labelVal = jsonObject[0]["Config"]["Labels"][key]
                labels[labelKey] = labelVal

    if jsonObject[0]["Config"]["Env"]:
        for env in jsonObject[0]["Config"]["Env"]:
            envItem = env.split("=")
            if envItem[0] in targetEnv:
                envKey = "container_env_{0}".format(envItem[0].replace(".", "_"))
                envVal = envItem[1]
                envs[envKey] = envVal

    return {"env": envs, "labels": labels}

def inspect(containerId):
    start = datetime.datetime.now()
    try:
        logger.info("ready to run docker inspect")
        dockerDockerInspect = utils.check_output(["docker", "inspect", containerId])
        inspectInfo = parse_docker_inspect(dockerDockerInspect)

        logger.info(inspectInfo)

        return inspectInfo
    except subprocess.CalledProcessError as e:
        logger.exception("command '%s' return with error (code %d): %s",
                e.cmd, e.returncode, e.output)
    finally:
        end = datetime.datetime.now()
        logger.info("docker inspect spent %s", end - start)

def main(argv):
    containerId = argv[0]
    print inspect(containerId)

# execute cmd example: python .\docker_inspect.py 33a22dcd4ba3
if __name__ == "__main__":
    main(sys.argv[1:])
