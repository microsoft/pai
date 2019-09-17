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


import os
import sys
import yaml
import readline
import logging
import logging.config

from .. import conf_storage_util
from ...paiLibrary.common import template_handler
from ...paiLibrary.common import file_handler
from ...paiLibrary.common import kubernetes_handler

package_directory_kubeinstall = os.path.dirname(os.path.abspath(__file__))



class getting_external_config:

    def __init__(self, **kwargs):

        self.logger = logging.getLogger(__name__)

        # Local cluster configuration path
        self.local_cluster_conf_path = None
        if "local_cluster_configuration" in kwargs and kwargs["local_cluster_configuration"] != None:
            self.local_cluster_conf_path = kwargs["local_cluster_configuration"]

        # Configuration for local conf
        self.external_storage_conf_path = None
        if "external_storage_conf_path" in kwargs and kwargs["external_storage_conf_path"] != None:
            self.external_storage_conf_path = kwargs["external_storage_conf_path"]

        # Configuration for configmap [Access to k8s through exist kube_config.]
        self.kube_config_path = None
        if "kube_config_path" in kwargs and kwargs["kube_config_path"] != None:
            self.kube_config_path = kwargs["kube_config_path"]

        self.external_storage_configuration = None



    def load_yaml_config(self, config_path):
        with open(config_path, "r") as f:
            cluster_data = yaml.load(f, yaml.SafeLoader)

        return cluster_data



    def load_from_local_conf(self):
        self.external_storage_configuration = self.load_yaml_config(self.external_storage_conf_path)



    def load_from_k8s_configmap(self, KUBE_CONFIG_PATH = None):
        if KUBE_CONFIG_PATH is None:
            KUBE_CONFIG_PATH = self.kube_config_path
        configmap_data_dict = kubernetes_handler.get_configmap(KUBE_CONFIG_PATH, "pai-external-storage-conf")
        if configmap_data_dict is None:
            self.logger.error("Unable to get the external storage configuration from k8s cluster.")
            self.logger.error("Please check the configmap named [pai-external-storage] in the namespace [default].")
            sys.exit(1)

        self.external_storage_configuration = yaml.load(configmap_data_dict["data"]["external-storage-conf"], yaml.SafeLoader)



    def construct_local_storage_type(self):

        external_storage_conf_tmp = dict()
        external_storage_conf_tmp["type"] = "local"
        external_storage_conf_tmp["path"] = self.local_cluster_conf_path
        self.external_storage_configuration = external_storage_conf_tmp



    def get_latest_external_configuration(self):
        if self.local_cluster_conf_path != None:
            self.construct_local_storage_type()
        elif self.external_storage_conf_path != None:
            self.load_from_local_conf()
        elif self.kube_config_path != None:
            self.load_from_k8s_configmap()
        else:
            self.logger.error("Ops, unable to get configuration conf.")
            self.logger.error("Please check your command and the corresponding path in your parameters.")
            sys.exit(1)

        return self.external_storage_configuration




class uploading_external_config:


    def __init__(self, **kwargs):

        self.logger = logging.getLogger(__name__)

        # Configuration for local conf
        self.external_storage_conf_path = None
        if "external_storage_conf_path" in kwargs and kwargs["external_storage_conf_path"] != None:
            self.external_storage_conf_path = kwargs["external_storage_conf_path"]

        # Configuration for configmap [Access to k8s through exist kube_config.]
        self.kube_config_path = None
        if "kube_config_path" in kwargs and kwargs["kube_config_path"] != None:
            self.kube_config_path = kwargs["kube_config_path"]



    def read_file_from_path(self, file_path):
        with open(file_path, "r") as fin:
            file_data = fin.read().decode('utf-8')

        return file_data



    def load_from_local_conf(self):
        return self.read_file_from_path(self.external_storage_conf_path)



    def check_cluster_id(self):

        cluster_id = conf_storage_util.get_cluster_id(self.kube_config_path)

        if cluster_id is None:
            self.logger.warning("No cluster_id found in your cluster.")
            user_input = raw_input("Please input the cluster-id for your cluster: ")
            conf_storage_util.update_cluster_id(self.kube_config_path, user_input)
            return False

        user_input = raw_input("Please input the cluster-id which you wanna operate: ")
        if user_input != cluster_id:
            self.logger.error("Ops, maybe you find the wrong cluster. Please check your input and the target cluster.")
            sys.exit(1)

        self.logger.info("Congratulations: Cluster-id checking passed.")
        return True



    def update_latest_external_configuration(self):

        self.logger.info("Begin to update the latest external configuration to k8s-cluster.")
        KUBE_CONFIG_PATH = None

        if self.kube_config_path != None:
            KUBE_CONFIG_PATH = self.kube_config_path
            self.logger.info("The path of KUBE_CONFIG is detected: {0} ".format(self.kube_config_path))
        else:
            self.logger.error("Unable to find the kubeconfig to connect to target cluster.")
            sys.exit(1)

        self.logger.info("Begin to load external cluster configuration from the path: {0}".format(self.external_storage_conf_path))
        external_storage_conf_dict = dict()
        external_storage_conf_dict["external-storage-conf"] = self.load_from_local_conf()

        self.check_cluster_id()

        kubernetes_handler.update_configmap(KUBE_CONFIG_PATH, "pai-external-storage-conf", external_storage_conf_dict)
        self.logger.info("Successfully update the external storage configuration.")
