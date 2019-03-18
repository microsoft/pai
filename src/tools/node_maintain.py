import requests
import logging
import os
import sys
import argparse
import time
import subprocess
import re
import unittest

sys.path.append("../..")
from deployment.paiLibrary.common.kubernetes_handler import get_configmap, update_configmap
from deployment.k8sPaiLibrary.maintainlib import common


def setup_logger():
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.DEBUG)
    ch = logging.StreamHandler()
    ch.setLevel(logging.DEBUG)
    formatter = logging.Formatter('[%(asctime)s] %(name)s:%(levelname)s: %(message)s')
    ch.setFormatter(formatter)
    logger.addHandler(ch)
    return logger


class KubernetesOperator(object):
    kubernetes_template = "../../deployment/k8sPaiLibrary/template/config.template"
    kube_config_path = "./.config"
    configmap_name = "exclude-file"
    configmap_data_key = "nodes"

    def __init__(self, master_ip):
        self.master_ip = master_ip
        self.setup_kubernetes_configfile(master_ip)

    def setup_kubernetes_configfile(self, api_servers_ip):

        template_data = common.read_template(self.kubernetes_template)
        dict_map = {
            "cluster_cfg": {"kubernetes": {"api-servers-ip": api_servers_ip}},
        }
        generated_data = common.generate_from_template_dict(template_data, dict_map)

        common.write_generated_file(generated_data, self.kube_config_path)

    def get_nodes(self):
        configmap_info = get_configmap(self.kube_config_path, self.configmap_name)
        nodes_str = configmap_info["data"][self.configmap_data_key]
        nodes = set(nodes_str.splitlines())
        return nodes

    def set_nodes(self, nodes):
        nodes = set(nodes)
        nodes_str = '\n'.join(nodes)
        data_dict = {self.configmap_data_key: nodes_str}
        update_configmap(self.kube_config_path, self.configmap_name, data_dict)

class YarnOperator(object):
    yarn_config_path = "./.hadoop"
    update_command = "yarn --config {} rmadmin -refreshNodes -g -server".format(yarn_config_path)

    def __init__(self, master_ip):
        self.master_ip = master_ip
        self.yarn_nodes_url = "http://{}:8088/ws/v1/cluster/nodes".format(master_ip)
        self.setup_yarn_configfile(master_ip)

    def setup_yarn_configfile(self, yarn_ip):
        if not os.path.exists(self.yarn_config_path):
            os.mkdir(self.yarn_config_path)

        yarn_config_str = \
        '''<configuration>
            <property>
                <name>yarn.resourcemanager.hostname</name>
                <value>{}</value>
            </property>
        </configuration>'''.format(yarn_ip)

        with open(os.path.join(self.yarn_config_path, "yarn-site.xml"), 'w') as f:
            f.write(yarn_config_str)

    def get_node_status(self):
        try:
            response = requests.get(self.yarn_nodes_url, timeout=10)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            logger.exception(e)
            sys.exit(1)

        nodes_info = response.json()
        current_nodes = {}
        for node in nodes_info["nodes"]["node"]:
            host, state = node["nodeHostName"], node["state"]
            current_nodes[host] = state
        return current_nodes

    def decommission_nodes(self):
        try:
            subprocess.check_output(self.update_command, stderr=subprocess.STDOUT, shell=True)
        except subprocess.CalledProcessError as e:
            logger.error(e.output)


class AlertOperator(object):
    ALERT_TYPE = {
        "gpu_related": {"NvidiaSmiLatencyTooLarge", "NvidiaSmiEccError", "NvidiaMemoryLeak", "NvidiaZombieProcess", "GpuUsedByExternalProcess", "GpuUsedByZombieContainer"},
    }

    def __init__(self, prometheus_ip, prometheus_port=9091):
        self.master_ip = prometheus_ip
        self.master_port = prometheus_port
        self.alert_manager_url = "http://{}:{}/prometheus/api/v1/query?query=ALERTS".format(prometheus_ip, prometheus_port)

    def get_gpu_alert_nodes(self):
        try:
            response = requests.get(self.alert_manager_url, timeout=10)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            logger.exception(e)
            sys.exit(1)

        if response.json()["status"] != "success":
            logger.error("Alert response error: {}".format(response.text))
            sys.exit(1)

        alerts_info = response.json()["data"]["result"]
        gpu_alert_nodes = {}
        for alert in alerts_info:
            metric = alert["metric"]
            if metric["alertname"] in self.ALERT_TYPE["gpu_related"] and metric["alertstate"] == "firing":
                node_ip = metric["instance"].split(':')[0]
                gpu_alert_nodes[node_ip] = metric["alertname"]

        return gpu_alert_nodes


def get_unready_nodes(decommissioned_nodes, current_status):
    unready_nodes = {}
    for node, state in current_status.items():
        # should decommission but not
        if state not in {"DECOMMISSIONED"} and node in decommissioned_nodes:
            unready_nodes[node] = state
        # should recommission but not
        if state in {"DECOMMISSIONED", "DECOMMISSIONING"} and node not in decommissioned_nodes:
            unready_nodes[node] = state
    return unready_nodes


def validate_string_is_ip(validated_str):
    ip_pattern = re.compile(r'^(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|[1-9])(\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)){3}$')
    found = ip_pattern.match(validated_str) is not None
    return found


def get_gpu_alert(args):
    alert_operator = AlertOperator(args.prometheus_ip, args.prometheus_port)
    alerting_nodes = alert_operator.get_gpu_alert_nodes()
    logger.info("Successfully aggregate gpu alerts.")
    if len(alerting_nodes) > 0:
        output_info = '\n'.join([node_name+': '+alert_type for node_name, alert_type in alerting_nodes.items()])
    else:
        output_info = "No gpu alerting nodes"
    print(output_info)


def get_decommission_nodes(args):
    k8s_operator = KubernetesOperator(args.api_server_ip)
    existing_nodes = k8s_operator.get_nodes()
    logger.info("Successfully aggregate blacklist info.")
    if len(existing_nodes) > 0:
        output_info = ','.join(existing_nodes)
    else:
        output_info = "No blacklist nodes"
    print(output_info)
    return existing_nodes


def add_decommission_nodes(args):
    k8s_operator = KubernetesOperator(args.api_server_ip)
    existing_nodes = k8s_operator.get_nodes()
    nodes = args.nodes
    inter_list = existing_nodes & nodes
    if len(inter_list) > 0:
        logger.warning("Try to add existing blacklist nodes: {}".format(','.join(inter_list)))
    full_list = existing_nodes | nodes
    k8s_operator.set_nodes(full_list)
    logger.info("Add node: {} to blacklist".format(','.join(args.nodes)))
    return full_list


def remove_decommission_nodes(args):
    k8s_operator = KubernetesOperator(args.api_server_ip)
    existing_nodes = k8s_operator.get_nodes()
    nodes = args.nodes
    supplement_list = nodes - existing_nodes
    if len(supplement_list) > 0:
        logger.warning("Try to remove non-existing blacklist nodes: {}".format(','.join(supplement_list)))
    full_list = existing_nodes - nodes
    k8s_operator.set_nodes(full_list)
    logger.info("Remove node: {} from blacklist".format(','.join(args.nodes)))
    return full_list


def update_decommission_nodes(args):
    k8s_operator = KubernetesOperator(args.api_server_ip)
    nodes = args.nodes
    k8s_operator.set_nodes(nodes)
    logger.info("Update blacklist nodes: {}".format(','.join(args.nodes)))
    return nodes


def refresh_yarn_nodes(args):
    k8s_operator = KubernetesOperator(args.api_server_ip)
    yarn_operator = YarnOperator(args.resource_manager_ip)
    while True:
        yarn_operator.decommission_nodes()
        current_status = yarn_operator.get_node_status()
        decommissioned_nodes = k8s_operator.get_nodes()
        unready_nodes = get_unready_nodes(decommissioned_nodes, current_status)
        if len(unready_nodes) == 0:
            break
        unready_info = ','.join([node_name+' in '+status for node_name, status in unready_nodes.items()])
        logger.info("Unready nodes: {}. Waiting...".format(unready_info))
        time.sleep(30)
    logger.info("Successfully refresh nodes.")


def convert_nodes(nodes_str):
    if isinstance(nodes_str, str):
        nodes = set(nodes_str.split(','))
        for node in nodes:
            if not validate_string_is_ip(node):
                raise argparse.ArgumentTypeError("Value has to be a comma-delimited ip list, but found {}".format(node))
        return nodes
    return set()


def setup_parser():
    top_parser = argparse.ArgumentParser()
    sub_parser = top_parser.add_subparsers(dest="subcommands")

    # a parent parser to avoid repeatedly add arguments for all subcommands
    parent_parser = argparse.ArgumentParser(add_help=False)
    parent_parser.add_argument("-m", "--master", dest="master_ip",
                               help="master node ip", required=True)
    parent_parser.add_argument("--resource-manager-ip",
                               help="specify yarn resource manager ip separately, by default it's master node ip")
    parent_parser.add_argument("--api-server-ip",
                               help="specify kubernetes api-server ip separately, by default it's master node ip")
    parent_parser.add_argument("--prometheus-ip",
                               help="specify prometheus ip separately, by default it's master node ip")
    parent_parser.add_argument("--prometheus-port", default=9091,
                               help="specify prometheus port, by default it's 9091")

    # prometheus operator parser
    prometheus_parser = sub_parser.add_parser("badgpus", help="query prometheus alerts")
    prometheus_subparsers = prometheus_parser.add_subparsers(dest="action")

    parser_get = prometheus_subparsers.add_parser("get", parents=[parent_parser], help="print current gpu alerts")
    parser_get.set_defaults(func=get_gpu_alert)

    # blacklist parser
    blacklist_parser = sub_parser.add_parser("blacklist", help="blacklist operation")
    blacklist_subparsers = blacklist_parser.add_subparsers(dest="action")

    parser_get = blacklist_subparsers.add_parser("get", parents=[parent_parser], help="get blacklist nodes")
    parser_get.set_defaults(func=get_decommission_nodes)

    parser_add = blacklist_subparsers.add_parser("add", parents=[parent_parser], help="add nodes to blacklist")
    parser_add.add_argument("-n", "--nodes", type=convert_nodes, help='support comma-delimited node list', required=True)
    parser_add.set_defaults(func=add_decommission_nodes)

    parser_remove = blacklist_subparsers.add_parser("remove", parents=[parent_parser], help="remove nodes from blacklist")
    parser_remove.add_argument("-n", "--nodes", type=convert_nodes, help='support comma-delimited node list', required=True)
    parser_remove.set_defaults(func=remove_decommission_nodes)

    parser_update = blacklist_subparsers.add_parser("update", parents=[parent_parser], help="update blacklist")
    parser_update.add_argument("-n", "--nodes", type=convert_nodes, help='support comma-delimited node list')
    parser_update.set_defaults(func=update_decommission_nodes)

    parser_refresh = blacklist_subparsers.add_parser("enforce", parents=[parent_parser],
                                                    help="enforce yarn to gracefully decommission nodes in blacklist")
    parser_refresh.set_defaults(func=refresh_yarn_nodes)

    return top_parser


def main():
    parser = setup_parser()
    args = parser.parse_args()
    args.resource_manager_ip = args.resource_manager_ip or args.master_ip
    args.api_server_ip = args.api_server_ip or args.master_ip
    args.prometheus_ip = args.prometheus_ip or args.master_ip
    args.func(args)


if __name__ == "__main__":
    logger = setup_logger()
    main()
