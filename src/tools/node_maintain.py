import requests
import logging
import os
import sys
import argparse
import time
import subprocess

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
        self.setup_kubernetes_configfile(master_ip)

    def setup_kubernetes_configfile(self, api_servers_ip):

        template_data = common.read_template(self.kubernetes_template)
        dict_map = {
            "cluster_cfg": { "kubernetes": {"api-servers-ip": api_servers_ip}},
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
            response = requests.get(self.yarn_nodes_url)
        except Exception as e:
            logger.exception(e)
            sys.exit(1)

        if response.status_code != requests.codes.ok:
            logger.error("Response error: {}".format(response.text))
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


def get_unready_nodes(decommissioned_nodes, current_status):
    unready_nodes = {}
    for node, state in current_status.iteritems():
        # should decommission but not
        if state not in {"DECOMMISSIONED"} and node in decommissioned_nodes:
            unready_nodes[node] = state
        # should recommission but not
        if state in {"DECOMMISSIONED"} and node not in decommissioned_nodes:
            unready_nodes[node] = state
    return unready_nodes


def get_decommission_nodes(args):
    k8s_operator = KubernetesOperator(args.api_server_ip)
    existing_nodes = k8s_operator.get_nodes()
    logger.info("Current unhealthy node list: {}".format(','.join(existing_nodes)))
    return existing_nodes


def add_decommission_nodes(args):
    k8s_operator = KubernetesOperator(args.api_server_ip)
    existing_nodes = k8s_operator.get_nodes()
    nodes = args.nodes
    if isinstance(nodes, str):
        nodes = set(nodes.split(','))
    full_list = existing_nodes | nodes
    k8s_operator.set_nodes(full_list)
    logger.info("Add node: {}".format(args.nodes))
    return full_list


def remove_decommission_nodes(args):
    k8s_operator = KubernetesOperator(args.api_server_ip)
    existing_nodes = k8s_operator.get_nodes()
    nodes = args.nodes
    if isinstance(nodes, str):
        nodes = set(nodes.split(','))
    full_list = existing_nodes - nodes
    k8s_operator.set_nodes(full_list)
    logger.info("Remove node: {}".format(args.nodes))
    return full_list


def update_decommission_nodes(args):
    k8s_operator = KubernetesOperator(args.api_server_ip)
    nodes = args.nodes
    if isinstance(nodes, str):
        nodes = set(nodes.split(','))
    k8s_operator.set_nodes(nodes)
    logger.info("Update node list: {}".format(args.nodes))
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
        logger.info("Unready nodes: {}. Waiting...".format(unready_nodes))
        time.sleep(30)
    logger.info("Successfully refresh nodes.")


def setup_parser():
    top_parser = argparse.ArgumentParser()
    top_parser.add_argument("master_ip", help="master node ip")
    top_parser.add_argument("--resource-manager-ip",
                            help="specify yarn resource manager ip separately, by default it's master node ip")
    top_parser.add_argument("--api-server-ip",
                            help="specify kubernetes api-server ip separately, by default it's master node ip")
    sub_parser = top_parser.add_subparsers(dest="subcommands")

    # node list parser
    nodelist_parser = sub_parser.add_parser("node-list", help="get or edit unhealthy node-list, won't trigger refresh")
    nodelist_subparsers = nodelist_parser.add_subparsers(dest="action")

    parser_get = nodelist_subparsers.add_parser("get", help="get unhealthy node list")
    parser_get.set_defaults(func=get_decommission_nodes)

    parser_add = nodelist_subparsers.add_parser("add", help="add unhealthy nodes")
    parser_add.add_argument("nodes", help='support comma-delimited node list')
    parser_add.set_defaults(func=add_decommission_nodes)

    parser_remove = nodelist_subparsers.add_parser("remove", help="remove unhealthy nodes")
    parser_remove.add_argument("nodes", help='support comma-delimited node list')
    parser_remove.set_defaults(func=remove_decommission_nodes)

    parser_update = nodelist_subparsers.add_parser("update", help="update unhealthy node list")
    parser_update.add_argument("nodes", help='support comma-delimited node list')
    parser_update.set_defaults(func=update_decommission_nodes)

    # yarn operator parser
    yarn_parser = sub_parser.add_parser("refresh", help="enforce service to graceful decommission nodes in node-list,"
                                                        "will not kill running job")
    yarn_parser.set_defaults(func=refresh_yarn_nodes)

    return top_parser


def main():
    parser = setup_parser()
    args = parser.parse_args()
    args.resource_manager_ip = args.resource_manager_ip or args.master_ip
    args.api_server_ip = args.api_server_ip or args.master_ip
    args.func(args)


if __name__ == "__main__":
    logger = setup_logger()
    main()
