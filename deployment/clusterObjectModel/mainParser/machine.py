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


class machine:

    def __init__(self, cluster_configuration):
        self.logger = logging.getLogger(__name__)
        self.cluster_configuration = cluster_configuration



    def run(self):
        None



    def validation_default_machine_properties:
        None



    def validation_machine_sku(self):
        cluster_cfg = self.cluster_configuration
        if "machine-sku" not in cluster_cfg:
            return False, "mahince-sku is miss."
        for sku_name, sku in cluster_cfg["machine-sku"]:
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
        dashboard_count = 0

        for host in cluster_cfg["machine-list"]:

            if "hostip" not in host:
                return False, "hostip is miss in the host [{0}]".format(str(host))
            if pai_k8s_common.ipv4_address_validation(host["hostip"]) is False:
                return False, "Please ensure the hostip is right, in the host [{0}]".format(str(host))

            if "machine-type" not in host:
                return False, "machine-type is miss in the host [{0}]".format(str(host))
            if host["machine-type"] not in cluster_cfg["machine-sku"]:
                return False, "mahine-type [{0}] is not in machine-sku."

            if "k8s-role" not in host:
                return False, "k8s-role is miss in the host [{0}]".format(str(host))
            if "k8s-role" is "master":
                if "etcdid" not in host:
                    return False, "etcdid is miss in one of the host with the [k8s-role: master]."
                if host["etcdid"] in etcd_id_visited:
                    return False, "Duplicated etcdid [{0}]. etcdid of each k8s master node shoule be unique.".format(host["etcdid"])

            if "pai-master" in host and "zkid" not in host:
                return False, "zkid is miss in one of the host with the [pai-master: true]"

            if "dashboard" in host and host["dashboard"] is "true":
                dashboard_count = dashboard_count + 1

        if dashboard_count == 0:
            return False, "dashboard label is miss."

        return True, None



    def validation_pre(self):



        return True, None



    def validation_post(self):
        return True, None
