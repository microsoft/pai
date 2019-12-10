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

from ...k8sPaiLibrary.maintainlib import common as pai_k8s_common


class Machine:

    def __init__(self, cluster_configuration):
        self.logger = logging.getLogger(__name__)
        self.cluster_configuration = cluster_configuration



    def validation_default_machine_properties(self):
        cluster_cfg = self.cluster_configuration
        if "default-machine-properties" not in cluster_cfg:
            return False, "default-machine-properties is miss in cluster-configuration.yaml"
        if "username" not in cluster_cfg["default-machine-properties"]:
            return False, "username is miss in cluster-configuration -> default-machine-properties."
        if "sshport" not in cluster_cfg["default-machine-properties"]:
            return False, "sshport is miss in cluster-configuration -> default-machine-properties."
        if ("keyfile-path" in cluster_cfg["default-machine-properties"]) is ("password" in cluster_cfg["default-machine-properties"]):
            return False, "Please set one and only one property between keyfile-path and password in cluster-configuration -> default-machine-properties."
        return True, None



    def validation_machine_sku(self):
        cluster_cfg = self.cluster_configuration
        if "machine-sku" not in cluster_cfg:
            return False, "machine-sku is miss."
        for sku_name in cluster_cfg["machine-sku"]:
            sku = cluster_cfg["machine-sku"][sku_name]
            if "cpu" not in sku:
                return False, "cpu is miss in the sku named [{0}]".format(sku_name)
            if "mem" not in sku:
                return False, "mem is miss in the sku named [{0}]".format(sku_name)
            if "os" not in sku:
                return False, "os is miss in the sku named [{0}]".format(sku_name)
        return True, False



    def validation_host_properties(self):
        cluster_cfg = self.cluster_configuration
        etcd_id_visited = dict()
        ip_visited = dict()
        dashboard_count = 0

        for host in cluster_cfg["machine-list"]:
            if "hostip" not in host:
                return False, "hostip is miss in the host [{0}]".format(str(host))
            if pai_k8s_common.ipv4_address_validation(host["hostip"]) is False:
                return False, "Please ensure the hostip is right, in the host [{0}]".format(str(host))
            if host["hostip"] in ip_visited:
                return False, "Duplicated IP address in machine-list. IP address is [{0}]".format(str(host["hostip"]))
            ip_visited[host["hostip"]] = True

            if "machine-type" not in host:
                return False, "machine-type is miss in the host [{0}]".format(str(host))
            if host["machine-type"] not in cluster_cfg["machine-sku"]:
                return False, "machine-type [{0}] is not in machine-sku."

            if "k8s-role" not in host:
                return False, "k8s-role is miss in the host [{0}]".format(str(host))
            if "k8s-role" is "master":
                if "etcdid" not in host:
                    return False, "etcdid is miss in one of the host with the [k8s-role: master]."
                if host["etcdid"] in etcd_id_visited:
                    return False, "Duplicated etcdid [{0}]. etcdid of each k8s master node shoule be unique.".format(host["etcdid"])

            if "pai-master" in host and "zkid" not in host:
                return False, "zkid is miss in one of the host with the [pai-master: true]"

            if "dashboard" in host and host["dashboard"] == "true":
                dashboard_count = dashboard_count + 1

        if dashboard_count == 0:
            return False, "dashboard label is miss."

        return True, None



    def validation_pre(self):
        ok, msg = self.validation_default_machine_properties()
        if ok is False:
            return False, msg

        ok, msg = self.validation_machine_sku()
        if ok is False:
            return False, msg

        ok, msg = self.validation_host_properties()
        if ok is False:
            return False, msg

        return True, None



    def validation_post(self, cluster_object_model):
        return True, None



    def run(self):
        com_machine = dict()
        com_machine["machine-sku"] = self.cluster_configuration["machine-sku"]
        com_machine["default-machine-properties"] = self.cluster_configuration["default-machine-properties"]
        com_machine["machine-list"] = dict()

        for host in self.cluster_configuration["machine-list"]:
            if "sshport" not in host:
                host["sshport"] = com_machine["default-machine-properties"]["sshport"]
            if "username" not in host:
                host["username"] = com_machine["default-machine-properties"]["username"]
            if "password" not in host and "keyfile-path" not in host:
                if "password" in com_machine["default-machine-properties"]:
                    host["password"] = com_machine["default-machine-properties"]["password"]
                else:
                    host["keyfile-path"] = com_machine["default-machine-properties"]["keyfile-path"]
            if "nodename" not in host:
                host["nodename"] = host["hostip"]
            if "docker-data" not in host:
                host["docker-data"] = "/var/lib/docker"
            com_machine["machine-list"][host["hostname"]] = host

        return com_machine
