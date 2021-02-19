import os
import sys
import re
import copy
import argparse
import math
from decimal import Decimal
import yaml
from kubernetes import client, config
from kubernetes.utils import parse_quantity
from kubernetes.client.rest import ApiException

# pylint: disable=import-error
from utils import get_logger, load_yaml_config, read_template, generate_template_file, get_masters_workers_from_layout


# reserved resources
PAI_RESERVE_RESOURCE_PERCENTAGE = 0.01
PAI_MAX_RESERVE_CPU_PER_NODE = 0.5
PAI_MAX_RESERVE_MEMORY_PER_NODE = 1024 # 1Gi

logger = get_logger(__name__)


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
                "cpu-resource": parse_quantity(node.status.allocatable['cpu']),
                "mem-resource": parse_quantity(node.status.allocatable['memory']) / 1024 / 1024,
            }
    except ApiException as e:
        logger.error("Exception when calling CoreV1Api->list_node: %s\n", e)
        raise

    return ret


def get_pod_requests(pod):
    ret = {
        "cpu-resource": 0,
        "mem-resource": 0,
    }
    for container in pod.spec.containers:
        if container.resources.requests is None:
            continue
        ret["cpu-resource"] += parse_quantity(container.resources.requests.get("cpu", 0))
        ret["mem-resource"] += parse_quantity(container.resources.requests.get("memory", 0)) / 1024 / 1024
    return ret


def get_kubernetes_pod_info_from_API():
    config.load_kube_config()
    api_instance = client.CoreV1Api()

    timeout_seconds = 56

    ret = dict()
    try:
        api_response = api_instance.list_pod_for_all_namespaces(timeout_seconds=timeout_seconds)
        for pod in api_response.items:
            if pod.spec.node_name not in ret:
                ret[pod.spec.node_name] = [get_pod_requests(pod)]
            else:
                ret[pod.spec.node_name].append(get_pod_requests(pod))
    except ApiException:
        logger.error("Exception when calling CoreV1Api->list_pod", exc_info=True)
        raise
    return ret


def get_node_resources():
    node_allocatable_resources = get_kubernetes_node_info_from_API()
    node_free_resources = copy.deepcopy(node_allocatable_resources)
    pod_resources_dict = get_kubernetes_pod_info_from_API()
    for node_name in node_free_resources:
        if node_name not in pod_resources_dict:
            continue
        for pod in pod_resources_dict[node_name]:
            node_free_resources[node_name]["cpu-resource"] -= pod["cpu-resource"]
            node_free_resources[node_name]["mem-resource"] -= pod["mem-resource"]
    return {"allocatable": node_allocatable_resources, "free": node_free_resources}


def get_pai_daemon_resource_request(cfg):
    ret = {
        "cpu-resource": 0,
        "mem-resource": 0
    }
    if "qos-switch" not in cfg or cfg["qos-switch"] == "false":
        logger.info("Ignore calculate pai daemon resource usage since qos-switch set to false")
        return ret

    pai_daemon_services = ["node-exporter", "job-exporter", "log-manager"]
    pai_source_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), "../../../src")

    # {%- if cluster_cfg['cluster']['common']['qos-switch'] == "true" %}
    start_match = r"{%-?\s*if\s*cluster_cfg\['cluster'\]\['common'\]\['qos-switch'\][^}]+%}"
    end_match = r"{%-?\s*endif\s*%}"  # {%- end %}
    str_match = "{}(.*?){}".format(start_match, end_match)
    regex = re.compile(str_match, flags=re.DOTALL)

    for pai_daemon in pai_daemon_services:
        deploy_template_path = os.path.join(pai_source_path, "{0}/deploy/{0}.yaml.template".format(pai_daemon))
        if os.path.exists(deploy_template_path):
            template = read_template(deploy_template_path)
            match = regex.search(template)
            if not match:
                logger.warning("Could not find resource request for service %s", pai_daemon)
                continue
            resources = yaml.load(match.group(1), yaml.SafeLoader)["resources"]
            if "requests" in resources:
                ret["cpu-resource"] += parse_quantity(resources["requests"].get("cpu", 0))
                ret["mem-resource"] += parse_quantity(resources["requests"].get("memory", 0)) / 1024 / 1024
            elif "limits" in resources:
                ret["cpu-resource"] += parse_quantity(resources["limits"].get("cpu", 0))
                ret["mem-resource"] += parse_quantity(resources["limits"].get("memory", 0)) / 1024 / 1024
        else:
            logger.warning("Could not find resource request for PAI daemon %s", pai_daemon)
    return ret


def get_min_free_resource(workers, node_resource_dict, pai_daemon_resource_dict):
    """
    get the minimum free memory and cpu resource among a list of workers
    """
    min_mem = math.inf
    min_cpu = math.inf

    for node_name in workers:
        reserved_cpu = min(node_resource_dict["allocatable"][node_name]["cpu-resource"] * \
            Decimal(PAI_RESERVE_RESOURCE_PERCENTAGE), Decimal(PAI_MAX_RESERVE_CPU_PER_NODE))
        reserved_mem = min(node_resource_dict["allocatable"][node_name]["mem-resource"] * \
            Decimal(PAI_RESERVE_RESOURCE_PERCENTAGE), Decimal(PAI_MAX_RESERVE_MEMORY_PER_NODE))
        min_cpu = min(min_cpu, node_resource_dict["free"][node_name]["cpu-resource"] - \
            pai_daemon_resource_dict["cpu-resource"] - reserved_cpu)
        min_mem = min(min_mem, node_resource_dict["free"][node_name]["mem-resource"] - \
            pai_daemon_resource_dict["mem-resource"] - reserved_mem)
        if min_cpu <= 0 or min_mem <= 0:
            logger.error("The node resource does not satisfy minmal requests. Requests cpu: %s, mem: %sMB.\
                          Allcoatable cpu: %s, mem: %sMB. Reserved cpu:%s, mem: %sMB.",
                node_resource_dict["allocatable"][node_name]["cpu-resource"] + abs(min_cpu),
                node_resource_dict["allocatable"][node_name]["mem-resource"] + abs(min_mem),
                node_resource_dict["allocatable"][node_name]["cpu-resource"],
                node_resource_dict["allocatable"][node_name]["mem-resource"],
                reserved_cpu, reserved_mem)
            sys.exit(1)

    return min_mem, min_cpu


def get_hived_config(layout, cluster_config):
    """
    generate hived config from layout.yaml and config.yaml
    Resources (gpu/cpu/mem) specified in layout.yaml is considered as the total resources.

    Parameters:
    -----------
    layout: dict
        layout
    cluster_config: dict
        cluster config

    Returns:
    --------
    dict
        hived config, used to render hived config template
        Example:
        {
            'skus': {
                'gpu-machine': {
                    'mem': 500,
                    'cpu': 2,
                    'gpu': True,
                    'gpuCount': 4,
                    'workers': [
                        'pai-gpu-worker0',
                        'pai-gpu-worker1'
                    ]
                },
                'cpu-machine': {
                    'mem': 500,
                    'cpu': 2,
                    'gpu': False,
                    'workers': [
                        'pai-cpu-worker0',
                        'pai-cpu-worker1'
                    ]
                }
            }
        }
    """
    # set `workers` field
    skus = {}
    for machine in layout['machine-list']:
        if 'pai-worker' in machine and machine['pai-worker'] == 'true':
            sku_name = machine['machine-type']
            if sku_name not in skus:
                skus[sku_name] = {
                    'workers' : [machine['hostname']]
                }
            else:
                skus[sku_name]['workers'].append(machine['hostname'])

    if not bool(skus):
        logger.error("No worker node detected.")
        sys.exit(1)

    node_resource_dict = get_node_resources()
    pai_daemon_resource_dict = get_pai_daemon_resource_request(cluster_config)

    for sku_name in skus:
        sku_mem_free, sku_cpu_free = get_min_free_resource(skus[sku_name]['workers'], node_resource_dict, pai_daemon_resource_dict)
        sku_spec = layout['machine-sku'][sku_name]
        # check if the machine has GPUs
        if 'computing-device' in sku_spec:
            skus[sku_name]['gpu'] = True
            skus[sku_name]['gpuCount'] = sku_spec['computing-device']['count']
            skus[sku_name]['memory'] = int(sku_mem_free / sku_spec['computing-device']['count'])
            skus[sku_name]['cpu'] = int(sku_cpu_free / sku_spec['computing-device']['count'])
        else:
            skus[sku_name]['gpu'] = False
            skus[sku_name]['memory'] = int(sku_mem_free / sku_cpu_free)
            skus[sku_name]['cpu'] = int(sku_cpu_free)

    return { "skus": skus }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('-l', '--layout', dest="layout", required=True,
                        help="layout.yaml")
    parser.add_argument('-c', '--config', dest="config", required=True,
                        help="cluster configuration")
    parser.add_argument('-o', '--output', dest="output", required=True,
                        help="cluster configuration")
    args = parser.parse_args()

    output_path = os.path.expanduser(args.output)
    layout = load_yaml_config(args.layout)
    cluster_config = load_yaml_config(args.config)

    masters, workers = get_masters_workers_from_layout(layout)
    head_node = masters[0]

    # Hivedscheduler is enabled by default.
    # But if the user sets enable_hived_scheduler to false manually,
    # we should disable it.
    if 'enable_hived_scheduler' in cluster_config and cluster_config['enable_hived_scheduler'] is False:
        hived_config = {}
    else:
        hived_config = get_hived_config(layout, cluster_config)

    environment = {
        'masters': masters,
        'workers': workers,
        'cfg': cluster_config,
        'head_node': head_node,
        'hived': hived_config,
    }

    map_table = {
        "env": environment
    }

    generate_template_file(
        os.path.abspath(os.path.join(os.path.abspath(__file__), '../../quick-start/services-configuration.yaml.template')),
        "{0}/services-configuration.yaml".format(output_path),
        map_table
    )


if __name__ == "__main__":
    main()
