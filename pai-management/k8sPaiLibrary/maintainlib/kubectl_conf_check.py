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
import common
import logging
import logging.config



package_directory_kubeinstall = os.path.dirname(os.path.abspath(__file__))



class kubectl_conf_check:

    """

       A class to install kubectl on your local dev-box

    """

    def __init__(self, cluster_config, **kwargs):

        self.logger = logging.getLogger(__name__)
        self.cluster_config = cluster_config
        self.kube_conf_path = os.path.expanduser("~/.kube")



    def check(self):

        self.logger.info("Checking kubectl's configuration for paictl.")

        if not os.path.exists(self.kube_conf_path):
            self.logger.warning("CHECKING FAILED: The path {0} doesn't exist.".format(self.kube_conf_path))
            return False
        self.logger.info("CHECKING PASS: The path {0} exists.".format(self.kube_conf_path))

        if not os.path.isfile("{0}/config".format(self.kube_conf_path)):
            self.logger.warning("CHECKING FAILED: The configuration file {0}/config doesn't exist.".format(self.kube_conf_path))
            return False
        self.logger.info("CHECKING PASS: The configuration file {0}/config exists.".format(self.kube_conf_path))


        try:
            local_kubectl_conf = common.load_yaml_file("{0}/config".format(self.kube_conf_path))
            api_server_address = local_kubectl_conf['clusters'][0]['cluster']['server']

            api_server_address_pai_conf = "http://{0}:8080".format(self.cluster_config['clusterinfo']['api-servers-ip'])

            if api_server_address != api_server_address_pai_conf:
                self.logger.warning("CHECKING FAILED: The api_server_address in local configuration is different from the one in pai's configuration.".format(self.kube_conf_path))
                return False

        except Exception as e:

            self.logger.error("CHECK FAILED:  Unable to compare api_server_address in the configuration.")
            return False

        self.logger.info("Kubectl environment checking task is passed.")

        return True









