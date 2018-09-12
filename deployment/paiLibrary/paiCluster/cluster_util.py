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
import logging
import logging.config
import importlib
from ..common import file_handler
from ..common import template_handler
from ...k8sPaiLibrary.maintainlib import clean
from ...k8sPaiLibrary.maintainlib import deploy
from ...k8sPaiLibrary.maintainlib import common as pai_common


logger = logging.getLogger(__name__)

def maintain_cluster_k8s(cluster_config, **kwargs):

    if kwargs["option_name"] == "deploy":
        job_instance = deploy.deploy(cluster_config, **kwargs)
        job_instance.run()
    elif kwargs["option_name"] == "clean":
        job_instance = clean.clean(cluster_config, **kwargs)
        job_instance.run()



def generate_configuration(quick_start_config_file, configuration_directory, force):
    """Automatically generate the following configuration files from a quick-start file:
        * Machine-level configurations: cluster-configuration.yaml
        * Kubernetes-level configurations I: kubernetes-configuration.yaml
        * Kubernetes-level configurations II: k8s-role-definition.yaml
        * Service-level configurations: service-configuration.yaml
    """
    quick_start_config_raw = file_handler.load_yaml_config(quick_start_config_file)
    quick_start_config = {}
    #
    # Prepare config of ssh info.
    quick_start_config["ssh-username"] = quick_start_config_raw["ssh-username"]
    quick_start_config["ssh-password"] = quick_start_config_raw["ssh-password"]
    if "ssh-keyfile-path" in quick_start_config_raw:
        quick_start_config["ssh-keyfile-path"] = quick_start_config_raw["ssh-keyfile-path"]
    if "ssh-secret-name" in quick_start_config_raw:
        quick_start_config["ssh-secret-name"] = quick_start_config_raw["ssh-secret-name"]
    quick_start_config["ssh-port"] = \
        22 if "ssh-port" not in quick_start_config_raw \
        else quick_start_config_raw["ssh-port"]
    #
    # Prepare config of cluster IP range.
    quick_start_config["service-cluster-ip-range"] = \
        "10.254.0.0/16" if "service-cluster-ip-range" not in quick_start_config_raw \
        else quick_start_config_raw["service-cluster-ip-range"]
    #
    # Prepare config of machine list.
    quick_start_config["machines"] = []
    for m in quick_start_config_raw["machines"]:
        quick_start_config["machines"].append({"hostname": None, "ip": m})
    #
    # Auto-complete missing configuration items: Part 1 -- DNS.
    if "dns" in quick_start_config_raw:
        quick_start_config["dns"] = quick_start_config_raw["dns"]
    else:
        m0 = quick_start_config["machines"][0]
        host_config = {
            "hostip": m0["ip"],
            "username": quick_start_config["ssh-username"],
            "password": quick_start_config["ssh-password"],
            "sshport": quick_start_config["ssh-port"]
        }
        if "ssh-keyfile-path" in quick_start_config:
            host_config["keyfile-path"] = quick_start_config["ssh-keyfile-path"]
        result_stdout, result_stderr = pai_common.ssh_shell_paramiko_with_result(
            host_config,
            "cat /etc/resolv.conf | grep nameserver | cut -d ' ' -f 2 | head -n 1")
        quick_start_config["dns"] = result_stdout.strip()
    #
    # Auto-complete missing configuration items: Part 2 -- hostnames.
    for m in quick_start_config["machines"]:
        host_config = {
            "hostip": m["ip"],
            "username": quick_start_config["ssh-username"],
            "password": quick_start_config["ssh-password"],
            "sshport": quick_start_config["ssh-port"]
        }
        if "ssh-keyfile-path" in quick_start_config:
            host_config["keyfile-path"] = quick_start_config["ssh-keyfile-path"]
        result_stdout, result_stderr = pai_common.ssh_shell_paramiko_with_result(
            host_config,
            "hostname")
        m["hostname"] = result_stdout.strip()
    #
    # Generate configuration files.
    target_file_names = [
        "cluster-configuration.yaml",
        "kubernetes-configuration.yaml",
        "k8s-role-definition.yaml",
        "services-configuration.yaml"
    ]
    for x in target_file_names:
        target_file_path = os.path.join(configuration_directory, x)
        if file_handler.file_exist_or_not(target_file_path) and force is False:
            print("File %s exists. Skip." % (target_file_path))
            pass
        else:
            file_handler.create_folder_if_not_exist(configuration_directory)
            file_handler.write_generated_file(
                target_file_path,
                template_handler.generate_from_template_dict(
                    file_handler.read_template("./deployment/quick-start/%s.template" % (x)),
                    { "env": quick_start_config }))
