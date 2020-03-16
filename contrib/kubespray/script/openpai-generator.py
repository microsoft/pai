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


def pod_is_ready_or_not(label_key, label_value, service_name):

    label_selector_str="{0}={1}".format(label_key, label_value)

    config.load_kube_config()
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
    for pod in pod_list.items:
        if pod.status.container_statuses is None:
            unready = unready + 1
        for container in pod.status.container_statuses:
            if container.ready != True:
                unready = unready + 1
            else:
                ready = ready + 1

    if unready != 0:
        logger.info("{0} is not ready.".format(service_name))
        logger.info("Total: {0}".format(ready + unready))
        logger.info("Ready: {1}",format(ready))
        return False

    return True


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
            gpu_resource = 0
            if 'nvidia.com/gpu' in node.status.allocatable:
                gpu_resource = int(parse_quantity(node.status.allocatable['nvidia.com/gpu']))
            if 'amd.com/gpu' in node.status.allocatable:
                gpu_resource = int(parse_quantity(node.status.allocatable['amd.com/gpu']))
            ret[node.metadata.name] = {
                "cpu-resource": int(parse_quantity(node.status.allocatable['cpu'])),
                "mem-resource": int(parse_quantity(node.status.allocatable['memory']) / 1024 / 1024 ),
                "gpu-resource": gpu_resource,
            }
    except ApiException as e:
        logger.error("Exception when calling CoreV1Api->list_node: %s\n" % e)

    return ret


def wait_nvidia_device_plugin_ready(total_time=3600):
    while pod_is_ready_or_not("name", "nvidia-device-plugin-ds", "Nvidia-Device-Plugin") != True:
        logger.info("Nvidia-Device-Plugin is not ready yet. Please wait for a moment!")
        time.sleep(10)
        total_time = total_time - 10
        if total_time < 0:
            logger.error("An issue occure when starting up Nvidia-Device-Plugin")
            sys.exit(1)


def wait_amd_device_plugin_ready(total_time=3600):
    while pod_is_ready_or_not("name", "amdgpu-dp-ds", "AMD-Device-Plugin") != True:
        logger.info("AMD-Device-Plugin is not ready yet. Please wait for a moment!")
        time.sleep(10)
        total_time = total_time - 10
        if total_time < 0:
            logger.error("An issue occure when starting up AMD-Device-Plugin")
            sys.exit(1)


def hived_config_prepare(worker_dict, node_resource_dict):
    hived_config = dict()
    hived_config["nodelist"] = []

    min_mem = 100000000
    min_gpu = 100000000
    min_cpu = 100000000

    for key in node_resource_dict:
        if key not in worker_dict:
            continue
        if node_resource_dict[key]["gpu-resource"] == 0:
            logger.error("Allocatable GPU number in {0} is 0, current quick start script does not allow.".format(key))
            logger.error("Please remove {0} from your workerlist, or check if the device plugin is running healthy on the node.".format(key))
            sys.exit(1)
        min_cpu = min(min_cpu, node_resource_dict[key]["cpu-resource"])
        min_mem = min(min_mem, node_resource_dict[key]["mem-resource"])
        min_gpu = min(min_gpu, node_resource_dict[key]["gpu-resource"])
        hived_config["nodelist"].append(key)
    if not hived_config["nodelist"]:
        logger.error("No worker node is detected.")
        sys.exit(1)

    hived_config["min-gpu"] = min_gpu
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
    wait_nvidia_device_plugin_ready()
    wait_amd_device_plugin_ready()
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