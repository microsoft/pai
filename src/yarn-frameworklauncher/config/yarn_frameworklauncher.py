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


class YarnFrameworklauncher:

    def __init__(self, cluster_configuration, service_configuration, default_service_configuration):
        self.logger = logging.getLogger(__name__)

        self.cluster_configuration = cluster_configuration
        self.service_configuration = self.merge_service_configuration(service_configuration, default_service_configuration)

    def merge_service_configuration(self, overwrite_srv_cfg, default_srv_cfg):
        if overwrite_srv_cfg == None:
            return default_srv_cfg
        srv_cfg = default_srv_cfg.copy()
        for k in overwrite_srv_cfg:
            v = overwrite_srv_cfg[k]
            if (k in srv_cfg and isinstance(overwrite_srv_cfg[k], dict) and isinstance(srv_cfg[k], dict)):
                srv_cfg[k] = self.merge_service_configuration(overwrite_srv_cfg[k], srv_cfg[k])
            else:
                srv_cfg[k] = overwrite_srv_cfg[k]
        return srv_cfg

    def validation_pre(self):
        if "frameworklauncher-port" not in self.service_configuration:
            return False, "frameworkerlaucnher-port is missed in service-configuration -> yarn-framworkerlauncher"
        return True, None

    def run(self):
        yarn_launcher_com = self.service_configuration

        yarn_launcher_com["node-list"] = list()
        yarn_launcher_com["webservice"] = ""

        # This properties is designed for single Instance, unable to support multiple launcher.
        yarn_launcher_com["launcher-address"] = ""

        for host in self.cluster_configuration["machine-list"]:
            if "pai-master" in host and host["pai-master"] == "true":
                yarn_launcher_com["node-list"].append(host["hostname"])
                yarn_launcher_com["webservice"] = yarn_launcher_com["webservice"] + "http://{0}:{1}".format(host["hostip"], str(self.service_configuration["frameworklauncher-port"]))
                yarn_launcher_com["launcher-address"] = host["hostip"]


        return yarn_launcher_com

    def validation_post(self, cluster_object_model):
        com = cluster_object_model

        if "hadoop-resource-manager" not in com or "master-ip" not in com["hadoop-resource-manager"]:
            return False, "hadoop-resource-manager.master-ip is missing in cluster-object-model."

        if "hadoop-name-node" not in com or "master-ip" not in com["hadoop-name-node"]:
            return False, "hadoop-name-node.master-ip is missing in cluster-object-model."

        if "hadoop-jobhistory" not in com:
            return False, "hadoop-jobhistory is missing in cluster-object-model."

        if "log-server-ip" not in com["hadoop-jobhistory"]:
            return False, "hadoop-jobhistory.log-server-ip is missing in cluster-object-model."

        if "timeline-server-ip" not in com["hadoop-jobhistory"]:
            return False, "hadoop-jobhistory.timeline-server-ip is missing in cluster-object-model."

        return True, None
