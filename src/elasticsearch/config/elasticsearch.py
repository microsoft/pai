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


import logging
import logging.config


class Elasticsearch:

    def __init__(self, cluster_configuration, service_configuration, default_service_configuraiton):
        self.logger = logging.getLogger(__name__)

        self.cluster_configuration = cluster_configuration


    def validation_pre(self):
        for host_config in self.cluster_configuration["machine-list"]:
            if "pai-master" in host_config and host_config["pai-master"] == "true":
                return True, None

        return False, "No master node found in machine list"



    def run(self):
        com = {"master-ip": None}

        for host_config in self.cluster_configuration["machine-list"]:
            if "pai-master" in host_config and host_config["pai-master"] == "true":
                com["master-ip"] = host_config["hostip"]
                break

        return com

    def validation_post(self, cluster_object_model):
        return True, None

