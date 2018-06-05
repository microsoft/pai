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

import yaml
import os
import sys
import subprocess
import jinja2
import argparse
import paramiko
import common
import kubectl_install
import logging
import logging.config


class deploy:

    """

       A class to deploy a new cluster.

    """

    def __init__(self, cluster_config, **kwargs):

        self.logger = logging.getLogger(__name__)

        self.cluster_config = cluster_config
        self.maintain_config = common.load_yaml_file("k8sPaiLibrary/maintainconf/deploy.yaml")
        self.clean_flag = kwargs["clean"]



    def prepare_package(self, node_config, job_name):

        common.maintain_package_wrapper(self.cluster_config, self.maintain_config, node_config, job_name)



    def delete_packege(self, node_config):

        common.maintain_package_cleaner(node_config)



    def remote_host_cleaner(self, node_config, job_name):

        commandline = "sudo rm -rf {0}*".format(job_name)

        if common.ssh_shell_paramiko(node_config, commandline) == False:
            return



    def job_executer(self, node_config, job_name):

        # sftp your script to remote host with paramiko.
        srcipt_package = "{0}.tar".format(job_name)
        src_local = "parcel-center/{0}".format(node_config["nodename"])
        dst_remote = "/home/{0}".format(node_config["username"])
        if common.sftp_paramiko(src_local, dst_remote, srcipt_package, node_config) == False:
            return

        commandline = "tar -xvf {0}.tar".format(job_name, node_config['hostip'])
        if common.ssh_shell_paramiko(node_config, commandline) == False:
            self.logger.error("Failed to uncompress {0}.tar".format(job_name))
            return

        commandline = "sudo ./{0}/hosts-check.sh {1}".format(job_name, node_config['hostip'])
        if common.ssh_shell_paramiko(node_config, commandline) == False:
            self.logger.error("Failed to update the /etc/hosts on {0}".format(node_config['hostip']))
            return

        commandline = "sudo ./{0}/docker-ce-install.sh".format(job_name)
        if common.ssh_shell_paramiko(node_config, commandline) == False:
            self.logger.error("Failed to install docker-ce on {0}".format(node_config['hostip']))
            return

        commandline = "sudo ./{0}/kubelet-start.sh {0}".format(job_name)
        if common.ssh_shell_paramiko(node_config, commandline) == False:
            self.logger.error("Failed to bootstrap kubelet on {0}".format(node_config['hostip']))
            return

        self.logger.info("Successfully running {0} job on node {1}!".format(job_name, node_config['hostip']))



    def create_kube_proxy(self):

        self.logger.info("Create kube-proxy daemon for kuberentes cluster.")

        file_path = "k8sPaiLibrary/template/kube-proxy.yaml.template"
        template_data = common.read_template(file_path)
        dict_map = {
            "clusterconfig": self.cluster_config['clusterinfo']
        }
        generated_data = common.generate_from_template_dict(template_data, dict_map)

        common.write_generated_file(generated_data, "kube-proxy.yaml")
        common.execute_shell(
            "kubectl create -f kube-proxy.yaml",
            "Failed to create kube-proxy"
        )

        os.remove("kube-proxy.yaml")



    def create_k8s_dashboard(self):

        self.logger.info("Create kubernetes dashboard deployment for kuberentes cluster.")


        self.logger.info("Create dashboard service.")
        file_path = "k8sPaiLibrary/template/dashboard-service.yaml.template"
        template_data = common.read_template(file_path)
        dict_map = {
            "clusterconfig": self.cluster_config['clusterinfo']
        }
        generated_data = common.generate_from_template_dict(template_data, dict_map)

        common.write_generated_file(generated_data, "dashboard-service.yaml")
        common.execute_shell(
            "kubectl create -f dashboard-service.yaml",
            "Failed to create dashboard-service"
        )

        os.remove("dashboard-service.yaml")

        self.logger.info("Create dashboard deployment.")
        file_path = "k8sPaiLibrary/template/dashboard-deployment.yaml.template"
        template_data = common.read_template(file_path)
        dict_map = {
            "clusterconfig": self.cluster_config['clusterinfo']
        }
        generated_data = common.generate_from_template_dict(template_data, dict_map)

        common.write_generated_file(generated_data, "dashboard-deployment.yaml")
        common.execute_shell(
            "kubectl create -f dashboard-deployment.yaml",
            "Failed to create dashboard-deployment"
        )

        os.remove("dashboard-deployment.yaml")




    def run(self):

        self.logger.warning("Begin to deploy a new cluster to your machine or vm.")

        for role in self.cluster_config["remote_deployment"]:
            listname = self.cluster_config["remote_deployment"][role]["listname"]

            if listname not in self.cluster_config:
                continue

            for node_key in self.cluster_config[listname]:
                node_config = self.cluster_config[listname][node_key]
                self.logger.info("Begin to deploy k8s on host {0}, the node role is [ {1} ]".format(node_config["hostip"], role))
                self.prepare_package(node_config, "{0}-deployment".format(role))
                self.job_executer(node_config, "{0}-deployment".format(role))

                if self.clean_flag == True:
                    self.logger.info(" package cleaner is working on the folder of {0}!".format(node_config["hostip"]))
                    self.delete_packege(node_config)
                    self.logger.info(" package cleaner's work finished! ")

                    self.logger.info(
                        " remote host cleaner is working on the host of {0}!".format(node_config["hostip"]))
                    self.remote_host_cleaner(node_config, "{0}-deployment".format(role))
                    self.logger.info(" remote host cleaning job finished! ")


        kubectl_install_instance = kubectl_install.kubectl_install(self.cluster_config)
        kubectl_install_instance.run()

        self.create_kube_proxy()
        self.create_k8s_dashboard()

        self.logger.info("The kubernetes deployment is finished!")





