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



class kubectl_install:

    """

       A class to install kubectl on your local dev-box

    """

    def __init__(self, cluster_config, **kwargs):

        self.logger = logging.getLogger(__name__)

        self.cluster_config = cluster_config



    def kubectl_install(self):

        self.logger.info("Execute the script to install kubectl on your host!")
        commandline = "./k8sPaiLibrary/maintaintool/kubectl-install.sh"
        common.execute_shell(
            commandline,
            "Failed to install kubectl on your dev-box"
        )



    def kubectl_configuration_generate(self):

        self.logger.info("Generate the configuation file of kubectl.")

        file_path = "k8sPaiLibrary/template/config.template"
        template_data = common.read_template(file_path)
        dict_map = {
            "clusterconfig": self.cluster_config['clusterinfo'],
        }
        generated_data = common.generate_from_template_dict(template_data, dict_map)

        kube_config_path = os.path.expanduser("~/.kube")
        common.write_generated_file(generated_data, "{0}/config".format(kube_config_path))



    def kubectl_ready_test(self):

        while True:
            res = common.execute_shell_return("kubectl get node", "There will be a delay after installing, please wait.")

            if res == True:
                break



    def run(self):

        self.kubectl_install()
        self.kubectl_configuration_generate()
        self.kubectl_ready_test()

