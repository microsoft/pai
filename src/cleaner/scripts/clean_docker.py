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

from cleaner.utils import common
import subprocess
import multiprocessing
import re

logger = multiprocessing.get_logger()


def check_disk_usage(partition):
    df = subprocess.Popen(["df","-h", partition], stdout=subprocess.PIPE)
    size = 0
    try:
        for line in df.stdout:
            splitline = line.decode().split()
            if splitline[5] == partition:
                size = int(splitline[4][:-1])
    except ValueError:
        logger.error("cannot get disk size, reset size to 0")
        size = 0
    logger.info("Checking disk, disk usage = {0}%".format(size))
    return size


def check_and_clean(threshold):
    if check_disk_usage("/") > int(threshold):
        logger.info("Disk usage is above {0}%, Try to remove containers".format(threshold))
        kill_largest_container()


# Clean logic v1: kill largest container
white_list = ["k8s_kube", "k8s_pylon", "k8s_zookeeper", "k8s_rest-server", "k8s_yarn", "k8s_hadoop", "k8s_job-exporter", "k8s_watchdog", "k8s_grafana", "k8s_node-exporter", "k8s_webportal", "k8s_prometheus", "k8s_nvidia-drivers", "k8s_etcd-container", "k8s_apiserver-container", "k8s_docker-cleaner", "kubelet"]
def kill_largest_container():
    containers = []
    # Only try to stop PAI jobs and user created containers
    containers_source = subprocess.Popen(["docker", "ps", "-a", "--format", r'{{.ID}}\t{{.Image}}\t{{.Size}}\t{{.Names}}'], stdout=subprocess.PIPE)
    for line in containers_source.stdout:
        splitline = line.split("\t")
        ignore = False
        for prefix in white_list:
            if (splitline[3].startswith(prefix)):
                ignore = True
                break
        if ignore == False:
            size = calculate_size(splitline[2].split()[0])
            containers.append([size, splitline[0], splitline[1]])

    containers.sort(key=lambda x:x[0], reverse=True)

    if containers.count > 0 and containers[0][0] > 1024**3:
        logger.warning("Kill container {0} due to disk pressure. Container size: {1}".format(containers[0][1], containers[0][0]))
        subprocess.Popen(["docker", "container", "stop", containers[0][1]])

        # Because docker stop will not immedicately stop container, we can not remove docker image right after stop container
        #container_image = subprocess.Popen(["docker", "inspect", containers[0][1], r"--format='{{.Image}}'"], stdout=subprocess.PIPE).stdout.readline()
        #subprocess.Popen(["docker", "image", "rmi", container_image])
        return True
    else:
        return False

size_defs={'B':1, 'K':1024, 'M':1024**2, 'G':1024**3, 'T':1024**4, 'b':1, 'k':1024, 'm':1024**2, 'g':1024**3, 't':1024**4}
def calculate_size(size_str):
    size_search = re.search(r"[BbKkMmGgTt]", size_str)
    return float(size_str[0:size_search.start()]) * size_defs[size_search.group()]


if __name__ == "__main__":
    common.setup_logging()
    check_and_clean(60)