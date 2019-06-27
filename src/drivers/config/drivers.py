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


class Drivers:

    def __init__(self, cluster_configuration, service_configuration, default_service_configuraiton):
        self.logger = logging.getLogger(__name__)

        self.cluster_configuration = cluster_configuration
        self.service_configuration = self.merge_service_configuration(service_configuration, default_service_configuraiton)



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
        if "set-nvidia-runtime" not in self.service_configuration:
            return False, "set-nvidia-runtime is miss in service-configuration -> drivers."
        if self.service_configuration["set-nvidia-runtime"] not in [False, True]:
            return False, "Value of set-nvidia-runtme should be false or true."
        if self.service_configuration["enable-ib-installation"] not in [False, True]:
            return False, "Value of enable-ib-installation should be false or true."
        if "version" not in self.service_configuration:
            return False, "version is miss in service-configuration -> drivers."
        if self.service_configuration["version"] not in ["384.111", "390.25", "410.73", "418.56"]:
            return False, "Value of version in drivers should be [384.111, 390.25, 410.73, 418.56]."
        return True, None



    def run(self):
        drivers_com = self.service_configuration
        return drivers_com



    def validation_post(self, cluster_object_model):
        return True, None

