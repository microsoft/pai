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


import yaml
import os
import sys
import subprocess
import jinja2
import argparse
import logging
import logging.config

from . import conf_storage_util


package_directory_kubeinstall = os.path.dirname(os.path.abspath(__file__))



class upload_configuration:


    def __init__(self, config_path, kube_confg_path):

        self.logger = logging.getLogger(__name__)
        self.KUBE_CONFIG_DEFAULT_LOCATION = os.path.expanduser("~/.kube/config")
        if kube_confg_path != None:
            self.KUBE_CONFIG_DEFAULT_LOCATION = kube_confg_path

        self.config_path = config_path



    def check_cluster_id(self):

        cluster_id = conf_storage_util.get_cluster_id(self.KUBE_CONFIG_DEFAULT_LOCATION)

        if cluster_id == None:
            self.logger.warning("No cluster_id found in your cluster.")
            user_input = raw_input("Please input the cluster-id for your cluster: ")
            conf_storage_util.update_cluster_id(self.KUBE_CONFIG_DEFAULT_LOCATION, user_input)
            return False

        user_input = raw_input("Please input the cluster-id which you wanna operate: ")
        if user_input != cluster_id:
            self.logger.error("Ops, maybe you find the wrong cluster. Please check your input and the target cluster.")
            sys.exit(1)

        self.logger.info("Congratulations: Cluster-id checking passed.")
        return True



    def upload_latest_configuration(self):

        conf_dict = dict()
        conf_dict["cluster-configuration.yaml"] = conf_storage_util.read_file_from_path("{0}/cluster-configuration.yaml".format(self.config_path))
        conf_dict["k8s-role-definition.yaml"] = conf_storage_util.read_file_from_path("{0}/k8s-role-definition.yaml".format(self.config_path))
        conf_dict["kubernetes-configuration.yaml"] = conf_storage_util.read_file_from_path(
            "{0}/kubernetes-configuration.yaml".format(self.config_path))
        conf_dict["services-configuration.yaml"] = conf_storage_util.read_file_from_path(
            "{0}/services-configuration.yaml".format(self.config_path))

        conf_storage_util.update_conf_configmap(self.KUBE_CONFIG_DEFAULT_LOCATION, conf_dict)



    def run(self):

        self.check_cluster_id()
        self.upload_latest_configuration()