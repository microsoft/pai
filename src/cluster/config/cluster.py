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


import sys
import subprocess
import logging
import logging.config


class Cluster:


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



    def validation_common(self, common_configuration):
        if "cluster-id" not in common_configuration:
            return False, "cluster-id is missing in service-configuration.yaml -> cluster -> common -> cluster-id"
        if "cluster-type" not in common_configuration or common_configuration["cluster-type"] not in ["yarn", "k8s"]:
            return False, "cluster-type is not defined or invalid. Please check service-configuration.yaml -> cluster -> common -> cluster-type"
        if "data-path" not in common_configuration:
            return False, "data-path is missing in service-configuration.yaml -> cluster -> common -> data-path"
        if "job-history" not in common_configuration:
            return False, "job-history is missing in service-configuration.yaml -> cluster -> common -> job-history"
        if "qos-switch" not in common_configuration:
            return False, "qos-switch is missing in service-configuration.yaml -> cluster -> common -> qos-switch"
        if "az-rdma" not in common_configuration:
            return False, "az-rdma is missing in service-configuration.yaml -> cluster -> common -> az-rdma"
        if "k8s-rbac" not in common_configuration:
            return False, "k8s-rbac is missing in service-configuration.yaml -> cluster -> common -> k8s-rbac"
        if "deploy-in-aks" not in common_configuration:
            return False, "deploy-in-aks is missing in service-configuration.yaml -> cluster ->common -> deploy-in-aks"
        return True, None



    def validation_docker_resgitry(self, docker_reg_configuration):
        if "namespace" not in docker_reg_configuration:
            return False, "namespace is miss in service-configuration.yaml -> cluster -> docker-registry -> namespace"
        if "domain" not in docker_reg_configuration:
            return False, "domain is miss in service-configuration.yaml -> cluster -> docker-registry -> domain"
        if "tag" not in docker_reg_configuration:
            return False, "tag is miss in service-configuration.yaml -> cluster -> docker-registry -> tag"
        if "secret-name" not in docker_reg_configuration:
            return False, "secret-name is miss in service-configuration.yaml -> cluster -> docker-registry -> secret-name"
        if ("username" in docker_reg_configuration) is not ("password" in docker_reg_configuration):
            return False, "username and password should be coexist, or please comment all of them."
        return True, None



    def validation_pre(self):
        if "common" not in self.service_configuration:
            return False, "common is miss in service-configuration.yaml -> cluster -> common"
        if "docker-registry" not in self.service_configuration:
            return False, "docker-registry is miss in service-configuration.yaml -> cluster -> docker-registry"

        ok, msg = self.validation_common(self.service_configuration["common"])
        if ok is False:
            return False, msg
        ok, msg = self.validation_docker_resgitry(self.service_configuration["docker-registry"])
        if ok is False:
            return False, msg

        return True, None



    def execute_shell(self, shell_cmd, error_msg):
        try:
            subprocess.check_call(shell_cmd, shell=True)

        except subprocess.CalledProcessError:
            self.logger.error(error_msg)
            raise Exception("Failed to execute the command [{0}]".format(shell_cmd))



    def execute_shell_with_output(self, shell_cmd, error_msg):
        try:
            res = subprocess.check_output(shell_cmd, shell=True)

        except subprocess.CalledProcessError:
            self.logger.error(error_msg)
            raise Exception("Failed to execute the command [{0}]".format(shell_cmd))

        return res



    def login_docker_registry(self, docker_registry, docker_username, docker_password):
        shell_cmd = "docker login -u {0} -p {1} {2}".format(docker_username, docker_password, docker_registry)
        error_msg = "docker registry login error"
        self.execute_shell(shell_cmd, error_msg)
        self.logger.info("docker registry login successfully")



    def generate_secret_base64code(self, docker_registry_configuration):
        domain = docker_registry_configuration["domain"] and str(docker_registry_configuration["domain"])
        username = docker_registry_configuration["username"] and str(docker_registry_configuration["username"])
        passwd = docker_registry_configuration["password"] and str(docker_registry_configuration["password"])

        if domain == "public":
            domain = ""

        if username and passwd:
            self.login_docker_registry(domain, username, passwd)

            base64code = self.execute_shell_with_output(
                "cat ~/.docker/config.json | base64",
                "Failed to base64 the docker's config.json"
            )
        else:
            self.logger.info("docker registry authentication not provided")

            base64code = "{}".encode("base64")

        docker_registry_configuration["base64code"] = base64code.replace("\n", "")



    def generate_docker_credential(self, docker_registry_configuration):
        username = docker_registry_configuration["username"] and str(docker_registry_configuration["username"])
        passwd = docker_registry_configuration["password"] and str(docker_registry_configuration["password"])

        if username and passwd:
            credential = self.execute_shell_with_output(
                "cat ~/.docker/config.json",
                "Failed to get the docker's config.json"
            )
        else:
            credential = "{}"

        docker_registry_configuration["credential"] = credential



    def generate_image_url_prefix(self, docker_registry_configuration):
        domain = str(docker_registry_configuration["domain"])
        namespace = str(docker_registry_configuration["namespace"])

        if domain != "public":
            prefix = "{0}/{1}/".format(domain, namespace)
        else:
            prefix = "{0}/".format(namespace)

        docker_registry_configuration["prefix"] = prefix



    def run(self):
        cluster_com = self.service_configuration

        self.generate_image_url_prefix(cluster_com["docker-registry"])
        if "username" not in cluster_com["docker-registry"]:
            cluster_com["docker-registry"]["username"] = None
        if "password" not in cluster_com["docker-registry"]:
            cluster_com["docker-registry"]["password"] = None

        try:
            self.generate_secret_base64code(cluster_com["docker-registry"])
            self.generate_docker_credential(cluster_com["docker-registry"])
        except Exception as e:
            self.logger.warning("Failed to generate docker credential and base64code.")
            self.logger.warning("Please confirm docker is installed in your host.")

        return cluster_com



    def validation_post(self, cluster_object_model):
        com = cluster_object_model
        return True, None
