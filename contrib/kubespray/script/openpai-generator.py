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

    api_instance  = client.CoreV1Api()

    # https://github.com/kubernetes-client/python/blob/master/kubernetes/docs/CoreV1Api.md#list_node
    pretty = 'true'
    #allow_watch_bookmarks = True
    timeout_seconds = 56
    try:
        api_response = api_instance.list_node(pretty=pretty, timeout_seconds=timeout_seconds)
        for node in api_response.items:
            cpu_resource_allocatable = parse_quantity(node.status.allocatable['cpu'])
            mem_resource_allocatable = parse_quantity(node.status.allocatable['memory']) / (1024 * 3)
            gpu_resource_allocatable = parse_quantity(node.status.allocatable['nvidia.com/gpu'])
            node_name = node.metadata.name
            print("{0} {1}".format(node.status.allocatable['cpu'], cpu_resource_allocatable))
            print("{0} {1}".format(node.status.allocatable['memory'], mem_resource_allocatable))
            print("{0} {1}".format(node.status.allocatable['nvidia.com/gpu'], gpu_resource_allocatable))
            print("{0}".format(node_name))
            pprint(node.status.allocatable)
            pprint(node.status.capacity)
    except ApiException as e:
        print("Exception when calling CoreV1Api->list_node: %s\n" % e)


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
    head_node = master_list[0]

    environment = {
        'master': master_list,
        'worker': csv_reader(args.worklist),
        'cfg': load_yaml_config(args.configuration),
        'head_node': head_node
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
    get_kubernetes_node_info_from_API()
    sys.exit(0)
    main()