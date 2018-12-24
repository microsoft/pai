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


class HadoopDataNode:

    def __init__(self, cluster_configuration, service_configuration, default_service_configuration):
        self.logger = logging.getLogger(__name__)

        self.cluster_configuration = cluster_configuration
        self.service_configuration = self.merge_service_configuration(service_configuration,
                                                                      default_service_configuration)

    def merge_service_configuration(self, overwrite_srv_cfg, default_srv_cfg):
        if overwrite_srv_cfg is None:
            return default_srv_cfg
        srv_cfg = default_srv_cfg.copy()
        for k in overwrite_srv_cfg:
            srv_cfg[k] = overwrite_srv_cfg[k]
        return srv_cfg

    def validation_pre(self):
        return True, None

    def run(self):
        com = {}
        # com["storage_path"] = self.service_configuration.get("storage_path") or \
        #                       "{}/hdfs/data".format(self.cluster_configuration["cluster"]["common"]["data-path"])
        com["storage_path"] = self.service_configuration.get("storage_path")
        return com

    def validation_post(self, cluster_object_model):
        if "master-ip" not in cluster_object_model["hadoop-name-node"]:
            return False, "No hdfs master ip found"
        return True, None

