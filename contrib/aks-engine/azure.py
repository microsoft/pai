#!/usr/bin/env python

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
import datetime
import yaml
import logging
import logging.config
import argparse
import subprocess
import sys
import time
import jinja2

from kubernetes import client, config
from kubernetes.utils import parse_quantity
from kubernetes.client.rest import ApiException


logger = logging.getLogger(__name__)

TEMPORARY_DIR_NAME = ".azure_quick_start"

def setup_logger_config(logger):
    """
    Setup logging configuration.
    """
    if len(logger.handlers) == 0:
        logger.propagate = False
        logger.setLevel(logging.DEBUG)
        consoleHandler = logging.StreamHandler()
        consoleHandler.setLevel(logging.DEBUG)
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        consoleHandler.setFormatter(formatter)
        logger.addHandler(consoleHandler)


def load_yaml_config(config_path):
    with open(config_path, "r") as f:
        config_data = yaml.load(f, yaml.SafeLoader)
    return config_data


def create_folder_if_not_exist(directory):
    if not os.path.exists(directory):
        os.makedirs(directory)


def execute_shell(shell_cmd, error_msg):
    try:
        subprocess.check_call( shell_cmd, shell=True )
    except subprocess.CalledProcessError:
        logger.error(error_msg)
        sys.exit(1)


def read_template(template_path):
    with open(template_path, "r") as f:
        template_data = f.read()
    return template_data


def generate_from_template_dict(template_data, map_table):
    generated_file = jinja2.Template(template_data).render(
        map_table
    )
    return generated_file


def write_generated_file(file_path, content_data):
    with open(file_path, "w+") as fout:
        fout.write(content_data)


def generate_template_file(template_file_path, output_path, map_table):
    template = read_template(template_file_path)
    generated_template = generate_from_template_dict(template, map_table)
    write_generated_file(output_path, generated_template)


def generate_aks_engine_script(aks_engine_cfg, working_dir, script_dir):
    generate_template_file(
        "{0}/templates/k8s.json.j2".format(script_dir),
        "{0}/k8s.json".format(working_dir),
        {"cfg": aks_engine_cfg}
    )
    generate_template_file(
        "{0}/templates/aks-engine.sh.j2".format(script_dir),
        "{0}/aks-engine.sh".format(working_dir),
        {
            "cfg": aks_engine_cfg,
            "working_dir": working_dir
        }
    )


def generate_openpai_configuration(k8s_info, aks_engine_cfg, working_dir, script_dir):
    generate_template_file(
        "{0}/templates/generate-key-and-cert.sh.j2".format(script_dir),
        "{0}/generate-key-and-cert.sh".format(working_dir),
        {
            "cfg": aks_engine_cfg,
            "k8s": k8s_info
        }
    )
    generate_template_file(
        "{0}/templates/layout.yaml.j2".format(script_dir),
        "{0}/layout.yaml".format(working_dir),
        {
            "cfg": aks_engine_cfg,
            "k8s": k8s_info
        }
    )
    generate_template_file(
        "{0}/templates/services-configuration.yaml.j2".format(script_dir),
        "{0}/services-configuration.yaml".format(working_dir),
        {
            "cfg": aks_engine_cfg,
            "k8s": k8s_info
        }
    )
    generate_template_file(
        "{0}/templates/start-openpai.sh.j2".format(script_dir),
        "{0}/start-openpai.sh".format(working_dir),
        {
            "cfg": aks_engine_cfg,
            "k8s": k8s_info
        }
    )


def pod_is_ready_or_not(label_key, label_value, service_name, kubeconfig):

    label_selector_str="{0}={1}".format(label_key, label_value)

    config.load_kube_config(config_file=kubeconfig)
    v1 = client.CoreV1Api()

    try:
        pod_list = v1.list_pod_for_all_namespaces(label_selector=label_selector_str, watch=False)
    except ApiException as e:
        logger.error("Exception when calling CoreV1Api->list_pod_for_all_namespaces: %s\n" % e)
        return False

    if len(pod_list.items) == 0:
        logger.warning("No pod can be dectected.")
        return False

    ready = 0
    unready = 0
    if len(pod_list.items) == 0:
        return False
    for pod in pod_list.items:
        if pod.status.container_statuses is None:
            unready = unready + 1
            continue
        flag = True
        for container in pod.status.container_statuses:
            if container.ready != True:
                unready = unready + 1
                flag = False
                break
        if flag:
            ready = ready + 1
    if unready != 0:
        logger.info("{0} is not ready.".format(service_name))
        logger.info("Total: {0}".format(ready + unready))
        logger.info("Ready: {0}".format(ready))
        return False

    return True


def wait_nvidia_device_plugin_ready(kubeconfig, total_time=3600):
    logger.info("Wait for Nvidia-Device-Plugin ready.")
    while not pod_is_ready_or_not("k8s-app", "nvidia-device-plugin", "Nvidia-Device-Plugin", kubeconfig):
        logger.info("Nvidia-Device-Plugin is not ready yet. Please wait for a moment!")
        time.sleep(10)
        total_time = total_time - 10
        if total_time < 0:
            logger.error("An issue occure when starting up Nvidia-Device-Plugin")
            sys.exit(1)
    logger.info("Nvidia-Device-Plugin is ready.")


def get_k8s_cluster_info(working_dir, dns_prefix, location):
    kube_config_path = "{0}/_output/{1}/kubeconfig/kubeconfig.{2}.json".format(working_dir, dns_prefix, location)
    master_string = "opmaster"
    worker_string = "opworker"

    config.load_kube_config(config_file=kube_config_path)
    api_instance = client.CoreV1Api()
    pretty = 'true'
    timeout_seconds = 56

    master = dict()
    worker = dict()
    sku = None
    gpu_enable = False
    master_ip = None
    master_ip_internal = None

    worker_count = 0
    worker_with_gpu = 0

    try:
        api_response = api_instance.list_node(pretty=pretty, timeout_seconds=timeout_seconds)
        for node in api_response.items:
            gpu_resource = 0
            if 'nvidia.com/gpu' in node.status.allocatable:
                gpu_resource = int(parse_quantity(node.status.allocatable['nvidia.com/gpu']))
            if master_string in node.metadata.name:
                master[node.metadata.name] = {
                    "cpu-resource": int(parse_quantity(node.status.allocatable['cpu'])),
                    "mem-resource": int(parse_quantity(node.status.allocatable['memory']) / 1024 / 1024 ),
                    "gpu-resource": gpu_resource,
                }
                master[node.metadata.name]["hostname"] = node.metadata.name
                for address in node.status.addresses:
                    if address.type == "Hostname":
                        continue
                    if master_ip == None:
                        master_ip = address.address
                    if address.type == "ExternalIP":
                        master_ip = address.address
                    if address.type == "InternalIP":
                        master[node.metadata.name]["ip"] = address.address
                        master_ip_internal = address.address
            elif worker_string in node.metadata.name:
                worker[node.metadata.name] = {
                    "cpu-resource": int(parse_quantity(node.status.allocatable['cpu'])),
                    "mem-resource": int(parse_quantity(node.status.allocatable['memory']) / 1024 / 1024 ),
                    "gpu-resource": gpu_resource,
                }
                if sku is None:
                    sku = dict()
                    if gpu_resource != 0:
                        sku["gpu_resource"] = worker[node.metadata.name]["gpu-resource"]
                        sku["mem-unit"] = int(worker[node.metadata.name]["mem-resource"] / worker[node.metadata.name]["gpu-resource"])
                        sku["cpu-unit"] = int(worker[node.metadata.name]["cpu-resource"] / worker[node.metadata.name]["gpu-resource"])
                    else:
                        sku["cpu_resource"] = worker[node.metadata.name]["cpu-resource"]
                        sku["mem-unit"] = int(worker[node.metadata.name]["mem-resource"] / worker[node.metadata.name]["cpu-resource"])
                worker_count = worker_count + 1
                if worker[node.metadata.name]["gpu-resource"] != 0:
                    worker_with_gpu = worker_with_gpu + 1
                    gpu_enable = True
                worker[node.metadata.name]["hostname"] = node.metadata.name
                for address in node.status.addresses:
                    if address.type == "Hostname":
                        continue
                    if address.type == "InternalIP":
                        worker[node.metadata.name]["ip"] = address.address

    except ApiException as e:
        logger.error("Exception when calling CoreV1Api->list_node: %s\n" % e)

    return {
        "master": master,
        "worker": worker,
        "sku": sku,
        "gpu": gpu_enable,
        "gpu-ready": worker_count == worker_with_gpu,
        "master_ip": master_ip,
        "master_internal": master_ip_internal,
        "working_dir": "{0}/{1}".format(working_dir, TEMPORARY_DIR_NAME),
        "kube_config": "{0}/_output/{1}/kubeconfig/kubeconfig.{2}.json".format(working_dir, dns_prefix, location)
    }


def start_kubernetes(working_dir, cfg, script_dir, dns_prefix, location):
    command = "/bin/bash {0}/aks-engine.sh".format(working_dir)
    execute_shell(command, "Failed to start k8s on azure with aks-engine.")
    logger.info("k8s is started successfully.")
    time.sleep(10)
    if "NC" in cfg["openpai_worker_vmss"]["vm_size"] or "NV" in cfg["openpai_worker_vmss"]["vm_size"] or "ND" in cfg["openpai_worker_vmss"]["vm_size"]:
        kube_config_path = "{0}/_output/{1}/kubeconfig/kubeconfig.{2}.json".format(script_dir, dns_prefix, location)
        wait_nvidia_device_plugin_ready(kube_config_path)
        tmp_cfg = get_k8s_cluster_info(script_dir, dns_prefix, location)
        while not tmp_cfg["gpu-ready"]:
            tmp_cfg = get_k8s_cluster_info(script_dir, dns_prefix, location)
        logger.info("GPU Resource is ready.")


def start_openpai(aks_engine_working_dir):
    command = "/bin/bash {0}/generate-key-and-cert.sh".format(aks_engine_working_dir)
    execute_shell(command, "Failed to generate ssl cert and private key for openpai.")

    command = "/bin/bash {0}/start-openpai.sh".format(aks_engine_working_dir)
    execute_shell(command, "Failed to start openpai.")


def update_az_network_rule(work_dir, cfg):
    logger.info("update nsg rule to disable ssh port ")

    command_login = "az login --service-principal --user {0} --password {1} --tenant {2}".format(
        cfg["sp_appid"],
        cfg["sp_password"],
        cfg["tenant"]
    )
    execute_shell(command_login, "Failed to login az cli with sp.")

    command_get_nsg = "az network nsg list --resource-group {0} --subscription {1} -o yaml > {2}/nsg.yml ".format(
        cfg["resource_group_name"],
        cfg["subscription_id"],
        work_dir
    )
    execute_shell(command_get_nsg, "Failed to get nsg.")
    nsg_cfg = load_yaml_config("{0}/nsg.yml".format(work_dir))

    nsg_name = None
    for nsg in nsg_cfg:
        if "k8s-master" in nsg["name"]:
            nsg_name = nsg["name"]
            break

    command_delete_rule = "az network nsg rule delete --resource-group {0} --subscription {1} --name {2} --nsg-name {3} ".format(
        cfg["resource_group_name"],
        cfg["subscription_id"],
        "allow_ssh",
        nsg_name
        )
    execute_shell(command_delete_rule, "Failed to delete nsg rule.")

    logger.info("update nsg rule successfully ")


def main():
    setup_logger_config(logger)

    parser = argparse.ArgumentParser(description="OpenPAI at Azure quick start")

    starttime = datetime.datetime.now()
    logger.info("Start to deploy azure {0}".format(starttime))

    parser.add_argument(
        '-c', '--config',
        required=True,
        help='The path of your configuration path.'
    )

    args = parser.parse_args()
    config_path = args.config

    logger.info("Loading aks engine configuration")
    aks_engine_cfg = load_yaml_config(config_path)

    python_script_path = os.path.dirname(os.path.realpath(__file__))
    current_working_dir = os.getcwd()
    aks_engine_working_dir = "{0}/{1}".format(current_working_dir, TEMPORARY_DIR_NAME)
    create_folder_if_not_exist(aks_engine_working_dir)

    generate_aks_engine_script(aks_engine_cfg, aks_engine_working_dir, python_script_path)
    start_kubernetes(aks_engine_working_dir, aks_engine_cfg, current_working_dir, aks_engine_cfg["dns_prefix"], aks_engine_cfg["location"])

    k8s_info = get_k8s_cluster_info(current_working_dir, aks_engine_cfg["dns_prefix"], aks_engine_cfg["location"])
    generate_openpai_configuration(k8s_info, aks_engine_cfg, aks_engine_working_dir, python_script_path)
    start_openpai(aks_engine_working_dir)
    update_az_network_rule(aks_engine_working_dir, aks_engine_cfg)

if __name__ == "__main__":
    main()

