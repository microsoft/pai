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


import time
import os
import tempfile

from ...confStorage.download import download_configuration
from ...clusterObjectModel.cluster_object_model import cluster_object_model



class service_management_configuration:

    def __init__(self, **kwargs):

        self.KUBE_CONFIG_LOCATION = None
        if "kube_config_path" in kwargs and kwargs["kube_config_path"] != None:
            self.KUBE_CONFIG_LOCATION = kwargs["kube_config_path"]

        self.time = str(int(time.time()))
        self.tmp_path = "tmp-service-config-{0}".format(self.time)
        self.tmp_path = os.path.join(tempfile.gettempdir(), self.tmp_path)

        self.cluster_object_service = None



    def get_latest_cluster_configuration_from_pai(self):
        config_get_handler = download_configuration(config_output_path = self.tmp_path, kube_config_path = self.KUBE_CONFIG_LOCATION)
        config_get_handler.run()



    def get_cluster_object_model_service(self):
        objectModelFactoryHandler = cluster_object_model(configuration_path = self.tmp_path)
        self.cluster_object_service = objectModelFactoryHandler.service_config()



    def run(self):
        self.get_latest_cluster_configuration_from_pai()
        self.get_cluster_object_model_service()
        return self.cluster_object_service
