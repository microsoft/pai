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




class cluster:


    def __init__(self, cluster_configuration, service_configuration, default_service_configuraiton):
        self.cluster_configuration = cluster_configuration
        self.service_configuration = service_configuration
        self.default_service_configuration = default_service_configuraiton



    def run(self):
        cls_conf = self.cluster_configuration
        srv_conf = self.service_configuration
        def_srv_conf = self.default_service_configuration



    def validation_common(self, common_configuration, type):

        if "data-path" in common_configuration:
            if os.path.isabs(common_configuration["data-path"]) is False:
                return False, "data-path in service-configuration->cluster->data-path should be an absolute path"
        elif type == "default":
            return False, "src/cluster/config/cluster.yaml should contains the configuration common.data-path!!"

        if "cluster-id" not in common_configuration and type == "default":
            return False, "src/cluster/config/cluster.yaml should contains the configuration common.cluster-id!!"

        return True, None



    def validation_docker_resgitry(self, docker_reg_configuration, stage):

        if "docker-registry" in docker_reg_configuration and stage is "overwirte":
            if "docker-namespace" not in docker_reg_configuration:
                return False, "docker-namespace in the service-configuration -> cluster -> docker-registry is missing!"
            if "docker-registry-domain" not in docker_reg_configuration:
                return False, "docker-registry-domain in the service-configuration -> cluster -> docker-registry is missing!"
            if "docker-tag" not in docker_reg_configuration:
                return False, "docker-tag in the service-configuration -> cluster -> docker-registry is missing!"
            if "secret-name" not in docker_reg_configuration:
                return False, "secret-name in the service-configuration -> cluster -> docker-registry is missing!"

            #if "docker-username" not in docker_reg_configuration:


        return True, None



    def validation_pre(self):
        cls_conf = self.cluster_configuration
        srv_conf = self.service_configuration
        def_srv_conf = self.default_service_configuration

        if "common" in srv_conf:
            ok, msg = self.validation_common(srv_conf["common"], "pre")
            if ok is False:
                return False, msg

        if "docker-registry" in srv_conf:
            ok, msg = self.validation_docker_resgitry(srv_conf["docker-registry"], "pre")
            if ok is False:
                return False, msg

        return True, None



    def validation_post(self, cluster_object_model):
        com = cluster_object_model
        return True, None
