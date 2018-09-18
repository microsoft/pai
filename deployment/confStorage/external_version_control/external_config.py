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
import yaml
import logging
import logging.config


package_directory_kubeinstall = os.path.dirname(os.path.abspath(__file__))


class external_config:

    def __init__(self, **kwargs):

        self.logger = logging.getLogger(__name__)
        self.kube_api_server_address = None
        self.conf_storage_path = "{0}/../../sysconf/conf_external_storage.yaml".format(package_directory_kubeinstall)

        if "kube-api-server-address" in kwargs["kube-api-server-address"]:
            self.kube_api_server_address = kwargs["kube-api-server-address"]



    def load_yaml_config(config_path):
        with open(config_path, "r") as f:
            cluster_data = yaml.load(f)

        return cluster_data



    def load_from_local_






