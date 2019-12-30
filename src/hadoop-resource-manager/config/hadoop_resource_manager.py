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


class HadoopResourceManager:

    def __init__(self, cluster_configuration, service_configuration, default_service_configuration):
        self.logger = logging.getLogger(__name__)

        self.cluster_configuration = cluster_configuration
        self.service_configuration = self.merge_service_configuration(service_configuration, default_service_configuration)

    def merge_service_configuration(self, overwrite_srv_cfg, default_srv_cfg):
        if overwrite_srv_cfg == None:
            return default_srv_cfg
        srv_cfg = default_srv_cfg.copy()
        for k in overwrite_srv_cfg:
            srv_cfg[k] = overwrite_srv_cfg[k]
        return srv_cfg

    def validation_pre(self):
        for host_config in self.cluster_configuration["machine-list"]:
            if "pai-master" in host_config and host_config["pai-master"] == "true":
                break
        else:
            return False, "No master node found in machine list"

        total_capacity = 0
        virtual_clusters_config = self.service_configuration["virtualClusters"]
        for vc_name in virtual_clusters_config:
            if virtual_clusters_config[vc_name]["capacity"] < 0:
                return False, "Capacity of VC '%s' (=%f) should be a positive number." % (vc_name, virtual_clusters_config[vc_name]["capacity"])
            total_capacity += virtual_clusters_config[vc_name]["capacity"]
        if total_capacity != 100:
            return False, "Total vc capacity doesn't equal to 100"

        return True, None


    def run(self):
        com = {}

        com["yarn_exporter_port"] = self.service_configuration["yarn_exporter_port"]
        com["yarn_log_retain_seconds"] = self.service_configuration["yarn_log_retain_seconds"]

        for host_config in self.cluster_configuration["machine-list"]:
            if "pai-master" in host_config and host_config["pai-master"] == "true":
                com["master-ip"] = host_config["hostip"]
                break

        virtual_clusters_config = self.service_configuration["virtualClusters"]

        hadoop_queues_config = {}
        for vc_name in virtual_clusters_config:
            hadoop_queues_config[vc_name] = {
                "description": virtual_clusters_config[vc_name]["description"],
                "weight": float(virtual_clusters_config[vc_name]["capacity"])
            }

        com["virtualClusters"] = virtual_clusters_config
        com["hadoopQueues"] = hadoop_queues_config

        return com

    def validation_post(self, cluster_object_model):
        return True, None

