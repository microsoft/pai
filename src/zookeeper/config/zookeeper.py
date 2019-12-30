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


import logging
import logging.config


class Zookeeper:

    def __init__(self, cluster_configuration, service_configuration, default_service_configuration):
        self.logger = logging.getLogger(__name__)

        self.cluster_configuration = cluster_configuration
        #self.service_configuration = None



    def validation_pre(self):
        zkid_visited = dict()
        for host_config in self.cluster_configuration["machine-list"]:
            if "pai-master" in host_config and host_config["pai-master"] == "true":
                if "zkid" not in host_config:
                    return False, "zkid is missing in your pai-master machine [{0}] .".format(host_config["hostip"])
                if host_config["zkid"] in zkid_visited and zkid_visited[host_config["zkid"]] is True :
                    return False, "Duplicated zkid [zkid: {0}]. ".format(host_config["zkid"])
                zkid_visited[host_config["zkid"]] = True

        return True, None



    def run(self):
        zookeeper_com = dict()
        zookeeper_com["host-list"] = list()
        zookeeper_com["quorum"] = ""

        for host_config in self.cluster_configuration["machine-list"]:
            if "pai-master" in host_config and host_config["pai-master"] == "true":
                zookeeper_com["host-list"].append(host_config["hostname"])
                if zookeeper_com["quorum"] != "":
                    zookeeper_com["quorum"] = zookeeper_com["quorum"] + ","
                zookeeper_com["quorum"] = zookeeper_com["quorum"] + host_config["hostip"] + ":2181"

        return zookeeper_com



    def validation_post(self, cluster_object_model):
        com = cluster_object_model
        return True, None
