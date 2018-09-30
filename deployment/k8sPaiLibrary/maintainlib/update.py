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
import logging
import logging.config

from . import add
from . import clean
from . import common
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



    """
    Check all machine in the k8s configuration. 
    With the url to check the k8s node is setup or not.
    
    URL: [ x.x.x.x:10248/healthz ]
    
    If ok, the node is setup. 
    Or paictl will first do a clean on the target node and then bootstrap corresponding service according to the role of the node.
    """
    def add_machine(self):
        None




    def remove_machine(self):
        None



    def run(self):
        self.k8s_configuration = self.get_latest_configuration_from_pai()
        self.node_list = self.get_node_list_from_k8s()
        self.add_machine()
        self.remove_machine()

        directory_handler.directory_delete(self.tmp_path)
