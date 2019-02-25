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

from cleaner.utils.logger import LoggerMixin
from cleaner.utils.timer import CountdownTimer, Timeout
from cleaner.utils import common
from datetime import timedelta
import subprocess
import multiprocessing
import re
import time

class DockerCleaner(LoggerMixin):
    def __init__(self, threshold, interval, timeout=timedelta(hours=1)):
        self.__threshold = int(threshold)
        self.__interval = int(interval)
        self.__timeout = timeout

    def _exec(self):
        exc = None
        try:
            with CountdownTimer(duration=self.__timeout):
                self.check_and_clean()
        except Timeout as e:
            self.logger.error("Cleaner timeout.")
            exc = e
        except Exception as e:
            self.logger.error("Unexpected error to run cleaner.")
            exc = e

        if exc is not None:
            self.logger.exception(exc)

    def run(self):
        while True:
            # allow a delay before the cleaning
            time.sleep(self.__interval)
            self._exec()


    def check_disk_usage(self, partition):
        df = subprocess.Popen(["df","-h", partition], stdout=subprocess.PIPE)
        size = 0
        try:
            for line in df.stdout:
                splitline = line.decode().split()
                if splitline[5] == partition:
                    size = int(splitline[4][:-1])
        except ValueError:
            self.logger.error("cannot get disk size, reset size to 0")
            size = 0
        self.logger.info("Checking disk, disk usage = {0}%".format(size))
        return size


    def check_and_clean(self):
        if self.check_disk_usage("/") >= self.__threshold:
            self.logger.info("Disk usage is above {0}%, Try to remove containers".format(self.__threshold))
            self.kill_largest_container()


    # Clean logic v1: kill largest container
    white_list = ["k8s_POD", "k8s_kube", "k8s_pylon", "k8s_zookeeper", "k8s_rest-server", "k8s_yarn", "k8s_hadoop", "k8s_job-exporter", "k8s_watchdog", "k8s_grafana", "k8s_node-exporter", "k8s_webportal", "k8s_prometheus", "k8s_nvidia-drivers", "k8s_etcd-container", "k8s_apiserver-container", "k8s_docker-cleaner", "kubelet", "dev-box"]
    def kill_largest_container(self):
        containers = []
        # Only try to stop PAI jobs and user created containers
        containers_source = subprocess.Popen(["docker", "ps", "-a", "--format", r'{{.ID}}\t{{.Image}}\t{{.Size}}\t{{.Names}}'], stdout=subprocess.PIPE)
        for line in containers_source.stdout:
            splitline = line.split("\t")
            for prefix in self.white_list:
                if (splitline[3].startswith(prefix)):
                    break
            else:
                size = common.calculate_size(splitline[2].split()[0])
                containers.append([size, splitline[0], splitline[1]])

        containers.sort(key=lambda x:x[0], reverse=True)

        if containers.count > 0 and containers[0][0] > 1024**3:
            self.logger.warning("Kill container {0} due to disk pressure. Container size: {1}".format(containers[0][1], containers[0][0]))
            subprocess.Popen(["docker", "kill", "--signal=10", containers[0][1]])

            # Because docker stop will not immedicately stop container, we can not remove docker image right after stop container
            #container_image = subprocess.Popen(["docker", "inspect", containers[0][1], r"--format='{{.Image}}'"], stdout=subprocess.PIPE).stdout.readline()
            #subprocess.Popen(["docker", "image", "rmi", container_image])
            return True
        else:
            return False

