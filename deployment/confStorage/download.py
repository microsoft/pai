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

from . import conf_storage_util
from ..utility import pai_version

package_directory_kubeinstall = os.path.dirname(os.path.abspath(__file__))


class download_configuration:

    def __init__(self, config_output_path, kube_config_path):

        self.logger = logging.getLogger(__name__)

        if kube_config_path != None:
            self.KUBE_CONFIG_DEFAULT_LOCATION = kube_config_path
        if config_output_path != None:
            self.config_path = config_output_path
        else:
            self.config_path = "."

    def check_cluster_id(self):

        cluster_id = conf_storage_util.get_cluster_id(self.KUBE_CONFIG_DEFAULT_LOCATION)

        if cluster_id is None:
            self.logger.error("No cluster_id found in your cluster, which should be done the first time you upload your configuration.")
            self.logger.error("Please execute the command following!")
            self.logger.error("paictl.py config push [-c /path/to/kubeconfig ] [-p /path/to/cluster/configuration | -e /path/to/external/storage/conf/path]")
            self.logger.error("More detailed information, please refer to the following link.")
            self.logger.error("https://github.com/Microsoft/pai/blob/master/docs/paictl/paictl-manual.md")
            sys.exit(1)

        user_input = raw_input("Please input the cluster-id which you wanna operate: ")
        if user_input != cluster_id:
            self.logger.error("Ops, maybe you find the wrong cluster. Please check your input and the target cluster.")
            sys.exit(1)

        self.logger.info("Congratulations: Cluster-id checking passed.")

    def download_cluster_configuration(self, local_path):

        # cluster_id = conf_storage_util.get_cluster_id(self.KUBE_CONFIG_DEFAULT_LOCATION)
        configuration_dict = conf_storage_util.get_conf_configmap(self.KUBE_CONFIG_DEFAULT_LOCATION)

        if configuration_dict is None:
            self.logger.error("The configuration doesn't exists on your cluster. Please upload it first.")
            sys.exit(1)

        conf_storage_util.create_path("{0}".format(local_path))
        for key in configuration_dict:
            conf_storage_util.write_generated_file(configuration_dict[key], "{0}/{1}".format(local_path, key))

    def run(self):

        self.check_cluster_id()
        pai_version.check_cluster_version()
        self.download_cluster_configuration(self.config_path)
