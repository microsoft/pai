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
import readline
import logging
import logging.config
import time

from . import conf_storage_util
from ..paiLibrary.common import file_handler, directory_handler
from ..utility import pai_version


package_directory_kubeinstall = os.path.dirname(os.path.abspath(__file__))


class upload_configuration:

    def __init__(self, config_path, kube_confg_path, upload_list = None):

        self.logger = logging.getLogger(__name__)
        self.KUBE_CONFIG_DEFAULT_LOCATION = os.path.expanduser("~/.kube/config")
        if kube_confg_path != None:
            self.KUBE_CONFIG_DEFAULT_LOCATION = kube_confg_path
        if upload_list != None:
            self.upload_list = upload_list
        else:
            self.upload_list = [
                "k8s-role-definition.yaml",
                "kubernetes-configuration.yaml",
                "layout.yaml",
                "services-configuration.yaml"
            ]

        self.config_path = config_path

    def check_cluster_id(self):
        service_config = conf_storage_util.load_yaml_config("{0}/services-configuration.yaml".format(self.config_path))
        # Default cluster-id in our default configuration is pai.
        cluster_id_in_config = 'pai'
        if 'cluster' in service_config and 'common' in service_config['cluster'] and 'cluster-id' in service_config['cluster']['common']:
            cluster_id_in_config = service_config['cluster']['common']['cluster-id']

        cluster_id = conf_storage_util.get_cluster_id(self.KUBE_CONFIG_DEFAULT_LOCATION)

        if cluster_id is None:
            self.logger.warning("No cluster-id found in your cluster.")
            self.logger.warning("cluster-id [ {0} ] in configuration will be updated into your cluster.".format(cluster_id_in_config))
            if cluster_id_in_config == 'pai':
                self.logger.warning("cluster_id [ pai ] is the default ID in configuration.")
                self.logger.warning("Because no cluster-id found in your configuration, it [pai] will be used.")
            conf_storage_util.update_cluster_id(self.KUBE_CONFIG_DEFAULT_LOCATION, cluster_id_in_config)
            self.logger.warning("Waiting 5s to update cluster-id.")
            time.sleep(5)
            cluster_id = cluster_id_in_config

        user_input = raw_input("Please input the cluster-id which you wanna operate: ")
        if user_input != cluster_id:
            self.logger.error("Ops, maybe you find the wrong cluster. Please check your input and the target cluster.")
            sys.exit(1)

        if cluster_id != cluster_id_in_config:
            self.logger.warning("Cluster ID's update is detected from your service-configuration!")
            self.logger.warning("The old one will be overwrote!")
            self.logger.warning("The new one is [ {0} ]!".format(cluster_id_in_config))
            conf_storage_util.update_cluster_id(self.KUBE_CONFIG_DEFAULT_LOCATION, cluster_id_in_config)
            self.logger.warning("Waiting 5s to update cluster-id.")
            time.sleep(5)

        self.logger.info("Congratulations: Cluster-id checking passed.")
        return True

    def upload_latest_configuration(self):

        conf_dict = dict()
        for config_name in self.upload_list:
            conf_dict[config_name] = conf_storage_util.read_file_from_path("{0}/{1}".format(self.config_path, config_name))
        if file_handler.file_exist_or_not("{0}/services-configuration.yaml.old".format(self.config_path)) == True:
            conf_dict["services-configuration.yaml.old"] = conf_storage_util.read_file_from_path(
                "{0}/services-configuration.yaml.old".format(self.config_path))
        conf_storage_util.update_conf_configmap(self.KUBE_CONFIG_DEFAULT_LOCATION, conf_dict)

    def run(self):

        self.check_cluster_id()
        pai_version.check_cluster_version()
        self.upload_latest_configuration()
