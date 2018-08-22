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


from __future__ import print_function

import os
import sys
import time
import logging
import subprocess
import logging.config

import kubernetes.client
from kubernetes import client, config, watch
from kubernetes.client.rest import ApiException


package_directory_kubeinstall = os.path.dirname(os.path.abspath(__file__))



class environment_check:

    def __init__(self):

        self.logger = logging.getLogger(__name__)

        self.KUBE_CONFIG_DEFAULT_LOCATION = os.path.expanduser("~/.kube/config")
        if os.environ.get('KUBECONFIG', None) != None:
            self.KUBE_CONFIG_DEFAULT_LOCATION = os.environ.get('KUBECONFIG', None)



    def execute_shell_return(self, shell_cmd, error_msg):

        try:
            subprocess.check_call(shell_cmd, shell=True)

        except subprocess.CalledProcessError:
            self.logger.error(error_msg)
            return False

        return True


    def check_conf_exits(self):

        if not os.path.isfile(self.KUBE_CONFIG_DEFAULT_LOCATION):
            self.logger.error(
                "CHECKING FAILED: The path {0} doesn't exist.".format(self.KUBE_CONFIG_DEFAULT_LOCATION)
            )
            sys.exit(1)

        self.logger.info(
            "CHECKING SUCCESSFULLY: Kubeconfig is found."
        )



    def check_kubectl(self):

        api_versions_cmd = "kubectl api-versions"
        error_msg = "Failed to execute the command [ kubectl api-versions ]"
        if self.execute_shell_return(api_versions_cmd, error_msg) == False:
            self.logger.error(
                "CHECKING FAILED: There is something wrong with kubectl. Please check."
            )
            sys.exit(1)
        self.logger.info(
            "CHECKING SUCCESSFULLY: Kubectl is found. And execute it successfully."
        )



    def init_kubernetes_client(self):

        config.load_kube_config(config_file = self.KUBE_CONFIG_DEFAULT_LOCATION)



    def check_python_kubernetes(self):

        #configuration = kubernetes.client.Configuration()
        core_api_instance = client.CoreApi()
        try_count = 0

        while True:

            try:
                self.logger.info("Try to access to the target kubernetes cluster")
                config.load_kube_config(config_file=self.KUBE_CONFIG_DEFAULT_LOCATION)
                api_response = core_api_instance.get_api_versions()
                self.logger.info(str(api_response))
                break

            except ApiException as e:
                self.logger.error("Failed connect to k8s with python client.")
                try_count = try_count + 1

            if try_count == 3:
                self.logger.error("All 3 tries of connecting k8s with python client fails.")
                sys.exit(1)

            time.sleep(5)

        self.logger.info(
            "CHECKING SUCCESSFULLY: Successfully access kubernetes through python client. "
        )



    def run(self):

        self.check_conf_exits()
        self.check_kubectl()

        self.init_kubernetes_client()
        self.check_python_kubernetes()



if __name__ == "__main__":

    env_test = environment_check()
    env_test.run()
