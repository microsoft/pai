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

from external_version_control.external_config import getting_external_config
from external_version_control.storage_factory import get_external_storage
from .upload import upload_configuration
from ..clusterObjectModel.service_config_update import ServiceConfigUpdate


class synchronization:

    def __init__(self, **kwargs):

        self.logger = logging.getLogger(__name__)

        # Configuration for local conf
        self.local_conf_path = None
        # Configuration for configmap [Access to k8s through exist kube_config.]
        self.kube_config_path = None
        # Cluster Configuration of pai.
        self.pai_cluster_configuration_path = None

        # External storage configuration data
        self.external_storage_configuration = None

        # The config list which should be pushed into cluster.
        self.config_push_list = None

        if "local_conf_path" in kwargs and kwargs["local_conf_path"] != None:
            self.local_conf_path = kwargs["local_conf_path"]

        if "kube_config_path" in kwargs and kwargs["kube_config_path"] != None:
            self.kube_config_path = kwargs["kube_config_path"]

        if "pai_cluster_configuration_path" in kwargs and kwargs["pai_cluster_configuration_path"] != None:
            self.pai_cluster_configuration_path = kwargs["pai_cluster_configuration_path"]

        if "config_push_list" in kwargs and kwargs["config_push_list"] != None:
            self.config_push_list = kwargs["config_push_list"]
        else:
            self.config_push_list = [
                "k8s-role-definition.yaml",
                "kubernetes-configuration.yaml",
                "layout.yaml",
                "services-configuration.yaml"
            ]



    def get_external_storage_conf(self):
        external_config = getting_external_config(
            external_storage_conf_path = self.local_conf_path,
            local_cluster_configuration = self.pai_cluster_configuration_path,
            kube_config_path = self.kube_config_path
        )
        return external_config.get_latest_external_configuration()



    def sync_data_from_source(self):

        self.external_storage_configuration = self.get_external_storage_conf()
        with get_external_storage(self.external_storage_configuration) as configuration_path:
            self.logger.info("The temporary cluster configuration path is : {0}".format(configuration_path))

            config_format_check = ServiceConfigUpdate(configuration_path)
            config_format_check.run()

            conf_uploader = upload_configuration(configuration_path, self.kube_config_path, self.config_push_list)
            conf_uploader.run()
            self.logger.info("Cluster Configuration synchronization from external storage is successful.")

