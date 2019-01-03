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
from ...k8sPaiLibrary.maintainlib import common as pai_common


logger = logging.getLogger(__name__)



def generate_configuration(quick_start_config_file, configuration_directory, force):
    """Automatically generate the following configuration files from a quick-start file:
        * Machine-level configurations: cluster-configuration.yaml
        * Kubernetes-level configurations I: kubernetes-configuration.yaml
        * Kubernetes-level configurations II: k8s-role-definition.yaml
        * Service-level configurations: service-configuration.yaml
    """
    quick_start_config_raw = file_handler.load_yaml_config(quick_start_config_file)

    #
    # Prepare machine list
    machine_list = []
    for m in quick_start_config_raw["machines"]:
        machine = {"hostip": m, "machine-type": "GENERIC"}
        # TODO on premise, using ip as "nodename"
        machine["nodename"] = m
        machine["docker-data"] = "/var/lib/docker"
        machine["username"] = quick_start_config_raw["ssh-username"]
        if "ssh-password" in quick_start_config_raw:
            machine["password"] = quick_start_config_raw["ssh-password"]
        else:
            machine["ssh-keyfile-path"] = quick_start_config_raw["ssh-keyfile-path"]
            machine["ssh-secret-name"] = quick_start_config_raw["ssh-secret-name"]
        machine["ssh-port"] = 22 if "ssh-port" not in quick_start_config_raw else quick_start_config_raw["ssh-port"]

        machine_list.append(machine)

    # workers
    worker_noders = machine_list[1:] if len(machine_list) > 1 else machine_list
    for machine in worker_noders:
        # k8s attributes
        machine["k8s-role"] = "worker"
        # PAI attributes
        machine["pai-worker"] = "true"

    # master
    master_node = machine_list[0]
    # k8s attributes
    master_node["k8s-role"] = "master"
    master_node["etcdid"] = "etcdid1"
    master_node["dashboard"] = "true"
    # PAI attributes
    master_node["pai-master"] = "true"
    master_node["zkid"] = "1"

    #
    # Prepare config of cluster IP range.
    service_cluster_ip_range = \
        "10.254.0.0/16" if "service-cluster-ip-range" not in quick_start_config_raw \
        else quick_start_config_raw["service-cluster-ip-range"]
    #
    # Auto-complete missing configuration items: Part 1 -- DNS.
    if "dns" in quick_start_config_raw:
        dns = quick_start_config_raw["dns"]
    else:
        result_stdout, result_stderr = pai_common.ssh_shell_paramiko_with_result(
            master_node,
            "cat /etc/resolv.conf | grep nameserver | cut -d ' ' -f 2 | head -n 1")
        dns = result_stdout.strip()
    #
    # Auto-complete missing configuration items: Part 2 -- hostnames.
    for host_config in machine_list:
        result_stdout, result_stderr = pai_common.ssh_shell_paramiko_with_result(
            host_config,
            "hostname")
        host_config["hostname"] = result_stdout.strip()

    #
    # kubernetes info
    api_server_url = "http://{0}:{1}".format(master_node["hostip"], 8080)
    dashboard_host = master_node["hostip"]

    #
    # Generate configuration files.
    target_file_names = [
        "layout.yaml",
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
                    { "env":
                        {
                            "machines": machine_list,
                            "dns": dns,
                            "service-cluster-ip-range": service_cluster_ip_range,
                            "api-server-url": api_server_url,
                            "dashboard-host": dashboard_host
                        }
                    }))
