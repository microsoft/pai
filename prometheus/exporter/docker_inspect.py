#!/usr/bin/python
import subprocess
import json
import sys

def parseDockerInspect(jsonStr):
    jsonObject = json.loads(jsonStr)
    labels = []
    envs = []
    inspectMetrics = {}

    for key in jsonObject[0]["Config"]["Labels"]:
        labels.append("container_label_{0}=\"{1}\"".format(key.replace(".", "_"), jsonObject[0]["Config"]["Labels"][key]))

    for env in jsonObject[0]["Config"]["Env"]:
        envItem = env.split("=")
        envs.append("container_env_{0}=\"{1}\"".format(envItem[0].replace(".", "_"), envItem[1]))

    inspectMetrics = {"env": envs, "labels": labels}
    return inspectMetrics
    
def inspect(argv):
    containerId = argv[0]

    try:
        dockerInspectCMD = "sudo docker inspect" + containerId
        dockerDockerInspect = subprocess.check_output([dockerInspectCMD])
        inspectInfo = parseDockerInspect(dockerDockerInspect)
        print(inspectInfo)
        return inspectInfo
    except subprocess.CalledProcessError as e:
        raise RuntimeError("command '{}' return with error (code {}): {}".format(e.cmd, e.returncode, e.output))

# execute cmd example: python .\docker_inspect.py 33a22dcd4ba3 
if __name__ == "__main__":
    inspect(sys.argv[1:])
