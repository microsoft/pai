import logging
import logging.config
import yaml
import os
import argparse
import csv
import jinja2
from kubernetes import client, config
from kubernetes.utils import parse_quantity
from kubernetes.client.rest import ApiException
from pprint import pprint
import sys
import time


def setup_logger_config(logger):
    """
    Setup logging configuration.
    """
    if len(logger.handlers) == 0:
        logger.propagate = False
        logger.setLevel(logging.DEBUG)
        consoleHandler = logging.StreamHandler()
        consoleHandler.setLevel(logging.DEBUG)
        formatter = logging.Formatter('%(asctime)s [%(levelname)s] - %(filename)s:%(lineno)s : %(message)s')
        consoleHandler.setFormatter(formatter)
        logger.addHandler(consoleHandler)


logger = logging.getLogger(__name__)
setup_logger_config(logger)


def csv_reader(csv_path):
    hosts_list = []
    with open(csv_path) as fin:
        hosts_csv = csv.reader(fin)
        for row in hosts_csv:
            hosts_list.append(
                {
                    "hostname": row[0],
                    "ip": row[1]
                }
            )
    return hosts_list


def csv_reader_ret_dict(csv_path):
    hosts_dict = {}
    with open(csv_path) as fin:
        hosts_csv = csv.reader(fin)
        for row in hosts_csv:
            hosts_dict[row[0]] = row[1]
    return hosts_dict


def load_yaml_config(config_path):
    with open(config_path, "r") as f:
        config_data = yaml.load(f, yaml.SafeLoader)
    return config_data


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


def get_kubernetes_node_info_from_API():
    config.load_kube_config()
    api_instance = client.CoreV1Api()

    # https://github.com/kubernetes-client/python/blob/master/kubernetes/docs/CoreV1Api.md#list_node
    pretty = 'true'
    timeout_seconds = 56

    ret = dict()
    try:
        api_response = api_instance.list_node(pretty=pretty, timeout_seconds=timeout_seconds)
        for node in api_response.items:
            ret[node.metadata.name] = {
                "allocatable-cpu-resource": int(parse_quantity(node.status.allocatable['cpu'])),
                "allocatable-mem-resource": int(parse_quantity(node.status.allocatable['memory']) / 1024 / 1024 / 1024),
                "allocatable-gpu-resource": int(parse_quantity(node.status.allocatable['nvidia.com/gpu'])),
            }
    except ApiException as e:
        logger.error("Exception when calling CoreV1Api->list_node: %s\n" % e)

    return ret


def hived_config_prepare(worker_dict, node_resource_dict):
    hived_config = dict()
    hived_config["nodelist"] = []

    min_mem = 100000000
    min_gpu = 100000000
    min_cpu = 100000000

    for key in node_resource_dict:
        if key not in worker_dict:
            continue
        if node_resource_dict[key]["allocatable-gpu-resource"] == 0:
            logger.error("Allocatable GPU number in {0} is 0, Hived doesn't support worker node with 0 GPU".format(key))
            logger.error("Please remove {0} from your worklist".format(key))
            sys.exit(1)
        min_cpu = min(min_cpu, node_resource_dict[key]["allocatable-cpu-resource"])
        min_mem = min(min_mem, node_resource_dict[key]["allocatable-mem-resource"])
        min_gpu = min(min_gpu, node_resource_dict[key]["allocatable-gpu-resource"])
        hived_config["nodelist"].append(key)
    if not hived_config["nodelist"]:
        logger.error("No worker node is detected.")
        sys.exit(1)

    hived_config["min-allocatable-gpu"] = min_gpu
    hived_config["unit-cpu"] = int( min_cpu / min_gpu )
    hived_config["unit-mem"] = int( min_mem / min_gpu )

    return hived_config


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('-w', '--worker-list-csv', dest="worklist", required=True,
                        help="worker-list")
    parser.add_argument('-m', '--master-list-csv', dest="masterlist", required=True,
                        help="master-list")
    parser.add_argument('-c', '--configuration', dest="configuration", required=True,
                        help="cluster configuration")
    parser.add_argument('-o', '--output', dest="output", required=True,
                        help="cluster configuration")
    args = parser.parse_args()

    output_path = os.path.expanduser(args.output)

    master_list = csv_reader(args.masterlist)
    worker_list = csv_reader(args.worklist)
    head_node = master_list[0]

    worker_dict = csv_reader_ret_dict(args.worklist)
    node_resource_dict = get_kubernetes_node_info_from_API()
    hived_config = hived_config_prepare(worker_dict, node_resource_dict)

    environment = {
        'master': master_list,
        'worker': worker_list,
        'cfg': load_yaml_config(args.configuration),
        'head_node': head_node,
        'hived': hived_config
    }

    map_table = {
        "env": environment
    }
    generate_template_file(
        "/quick-start-config/layout.yaml.template",
        "{0}/layout.yaml".format(output_path),
        map_table
    )
    generate_template_file(
        "/quick-start-config/services-configuration.yaml.template",
        "{0}/services-configuration.yaml".format(output_path),
        map_table
    )


if __name__ == "__main__":
    main()