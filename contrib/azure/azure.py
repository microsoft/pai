#!/usr/bin/env python

import os
import datetime
import yaml
import logging.config
import argparse
import subprocess
import sys
import jinja2

from kubernetes import client, config
from kubernetes.utils import parse_quantity
from kubernetes.client.rest import ApiException


logger = logging.getLogger(__name__)

TEMPORARY_DIR_NAME = ".azure_quick_start"


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


def start_kubernetes(working_dir):
    command = '/bin/bash {0}/aks-engine.sh'.format(working_dir)
    execute_shell(command, "Failed to start k8s on azure with aks-engine.")


def get_k8s_cluster_info(working_dir, dns_prefix, location):
    kube_config_path = "{0}/_output/{1}/kubeconfig/kubeconfig.{2}.json".format(working_dir, dns_prefix, location)
    print(kube_config_path)
    master_string = "opmaster"
    worker_string = "opworker"

    config.load_kube_config(config_file=kube_config_path)
    api_instance = client.CoreV1Api()
    pretty = 'true'
    timeout_seconds = 56

    master = dict()
    worker = dict()
    sku = dict()
    gpu_enable = False
    master_ip = None

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
                for address in node.status.address:
                    if address.type == "Hostname":
                        continue
                    if master_ip == None:
                        master_ip = address.address
                    if address.type == "ExternalIP":
                        master_ip = address.address
                    if address.type == "InternalIP":
                        master[node.metadata.name]["ip"] = address.address
            elif worker_string in node.metadata.name:
                worker[node.metadata.name] = {
                    "cpu-resource": int(parse_quantity(node.status.allocatable['cpu'])),
                    "mem-resource": int(parse_quantity(node.status.allocatable['memory']) / 1024 / 1024 ),
                    "gpu-resource": gpu_resource,
                }
                if not sku:
                    if gpu_resource != 0:
                        sku["gpu_resource"] = worker[node.metadata.name]["gpu-resource"]
                        sku["mem-unit"] = int(worker[node.metadata.name]["mem-resource"] / worker[node.metadata.name]["gpu-resource"])
                        sku["cpu-unit"] = int(worker[node.metadata.name]["cpu-resource"] / worker[node.metadata.name]["gpu-resource"])
                    else:
                        sku["cpu_resource"] = worker[node.metadata.name]["cpu-resource"]
                        sku["mem-unit"] = int(worker[node.metadata.name]["mem-resource"] / worker[node.metadata.name]["cpu-resource"])

                if worker[node.metadata.name]["gpu-resource"] != 0:
                    gpu_enable = True
                worker[node.metadata.name]["hostname"] = node.metadata.name
                for address in node.status.address:
                    if address.type == "Hostname":
                        continue
                    if address.type == "InternalIP":
                        master[node.metadata.name]["ip"] = address.address

    except ApiException as e:
        logger.error("Exception when calling CoreV1Api->list_node: %s\n" % e)

    return {
        "master": master,
        "worker": worker,
        "sku": sku,
        "gpu": gpu_enable,
        "master_ip": master_ip,
        "working_dir": "{0}/{1}".format(working_dir, TEMPORARY_DIR_NAME)
    }


def main():
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

    #generate_aks_engine_script(aks_engine_cfg, aks_engine_working_dir, python_script_path)
    #start_kubernetes(aks_engine_working_dir)

    k8s_info = get_k8s_cluster_info(current_working_dir, aks_engine_cfg["dns_prefix"], aks_engine_cfg["location"])
    generate_openpai_configuration(k8s_info, aks_engine_cfg, aks_engine_working_dir, python_script_path)


if __name__ == "__main__":
    main()

