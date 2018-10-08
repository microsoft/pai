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

import sys
import time
import requests
import logging
import logging.config

from . import add as k8s_add
from . import clean as k8s_clean
from . import common as k8s_common
from . import remove as k8s_remove
from ...confStorage.download import download_configuration
from ...paiLibrary.common import directory_handler
from ...paiLibrary.common import kubernetes_handler
from ...paiLibrary.clusterObjectModel import objectModelFactory


class update:

    def __init__(self, **kwargs):
        self.logger = logging.getLogger(__name__)

        self.kube_config_path = None
        if "kube_config_path" in kwargs and kwargs[ "kube_config_path" ] != None:
            self.kube_config_path = kwargs[ "kube_config_path" ]

        if self.kube_config_path == None:
            self.logger.error("Unable to find KUBECONFIG. Please ensure that you have passed the correct path.")
            sys.exit(1)

        self.time = str(int(time.time()))
        self.tmp_path = "./tmp-machine-update-{0}"



    def get_latest_configuration_from_pai(self):
        directory_handler.directory_create(self.tmp_path)

        download_configuration(config_output_path=self.tmp_path, kube_config_path=self.kube_config_path)
        objectModel = objectModelFactory.objectModelFactory(self.tmp_path)
        ret = objectModel.objectModelPipeLine()

        directory_handler.directory_delete(self.tmp_path)
        return ret["k8s"]



    def get_node_list_from_k8s(self):
        node_list = kubernetes_handler.list_all_nodes(PAI_KUBE_CONFIG_PATH=self.kube_config_path)
        return node_list



    def check_node_healthz(self, address):
        r = requests.get("http://{0}:10248/healthz".format(address))
        if r.status_code == 200:
            return True
        rep_error = r.raise_for_status()
        if rep_error != None:
            self.logger.error(str(rep_error))
        return False



    def remove(self, node_config, cluster_config):
        remove_worker = k8s_remove.remove(cluster_config, node_config, True)
        remove_worker.run()

        if node_config["k8s-role"] == "master":
            self.logger.info("master node is removed, sleep 60s for etcd cluster's updating")
            time.sleep(60)



    def install(self, node_config, cluster_config):
        add_worker = k8s_add.add(cluster_config, node_config, True)
        add_worker.run()

        if node_config["k8s-role"] == "master":
            self.logger.info("Master Node is added, sleep 60s to wait it ready.")
            time.sleep(60)



    def node_status_check(self, node_config, node_list):
        node_name = node_config["nodename"]
        if node_name not in node_list:
            return False

        for condition_instance in node_list[node_name]:
            if condition_instance["type"] != "Ready":
                continue
            if condition_instance["status"] != "True":
                return False
            break

        if not self.check_node_healthz(node_config["hostip"]):
            return False

        return True



    """
    Check all machine in the k8s configuration. 
    With the url to check the k8s node is setup or not.
    
    URL: [ x.x.x.x:10248/healthz ]
    
    If ok, the node is setup. 
    Or paictl will first do a clean on the target node and then bootstrap corresponding service according to the role of the node.
    """
    def add_machine(self):

        node_list = self.node_list
        cluster_configuration = self.k8s_configuration

        for role in cluster_configuration["remote_deployment"]:
            listname = cluster_configuration["remote_deployment"][role]["listname"]
            if listname not in cluster_configuration:
                continue

            for node_key in cluster_configuration[listname]:
                node_config = cluster_configuration[listname][node_key]

                if not self.node_status_check(node_config, node_list):
                    self.remove(node_config, cluster_configuration)
                    self.install(node_config, cluster_configuration)



    """
    Check all machine in the node list from k8s.
    If the nodename not in the k8s configuration. 
    Paictl will clean the node.
    Or do nothing.
    """
    def remove_machine(self):
        None



    def run(self):
        self.k8s_configuration = self.get_latest_configuration_from_pai()
        self.node_list = self.get_node_list_from_k8s()
        self.add_machine()
        self.remove_machine()

        directory_handler.directory_delete(self.tmp_path)
