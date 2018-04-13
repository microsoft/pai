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

targetLabel = {"PAI_HOSTNAME", "PAI_JOB_NAME", "PAI_USER_NAME", "PAI_CURRENT_TASK_ROLE_NAME", "GPU_ID"}
targetEnv = {"PAI_TASK_INDEX"}

def parseDockerInspect(jsonStr):
    jsonObject = json.loads(jsonStr)
    labels = []
    envs = []
    inspectMetrics = {}

    if jsonObject[0]["Config"]["Labels"]:
        for key in jsonObject[0]["Config"]["Labels"]:
            if key in targetLabel:
                labels.append("container_label_{0}=\"{1}\"".format(key.replace(".", "_"), jsonObject[0]["Config"]["Labels"][key]))
            
    if jsonObject[0]["Config"]["Env"]:
        for env in jsonObject[0]["Config"]["Env"]:
            envItem = env.split("=")
            if envItem[0] in targetEnv:
                envs.append("container_env_{0}=\"{1}\"".format(envItem[0].replace(".", "_"), envItem[1]))
    
    inspectMetrics = {"env": envs, "labels": labels}
    return inspectMetrics
    
def inspect(containerId):
    try:
        dockerInspectCMD = "docker inspect " + containerId
        dockerDockerInspect = subprocess.check_output([dockerInspectCMD], shell=True)
        inspectInfo = parseDockerInspect(dockerDockerInspect)
        print(inspectInfo)
        return inspectInfo
    except subprocess.CalledProcessError as e:
        raise RuntimeError("command '{}' return with error (code {}): {}".format(e.cmd, e.returncode, e.output))

def main(argv):
    containerId = argv[0]
    inspect(containerId)

# execute cmd example: python .\docker_inspect.py 33a22dcd4ba3 
if __name__ == "__main__":
    main(sys.argv[1:])
