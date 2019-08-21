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

from __future__ import print_function

import argparse
import time
import re
import logging
import copy
import sys

from utility import log
log.setup_logging()

from operator_wrapper import AlertOperator, KubernetesOperator, YarnOperator, Resource, RestserverOperator

logger = logging.getLogger(__name__)

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
    ip_pattern = re.compile(r"^(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|[1-9])(\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)){3}$")
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
        node_info = yarn_operator.get_nodes_info()
        current_status = {k: v["state"] for k, v in node_info.items()}
        decommissioned_nodes = k8s_operator.get_nodes()
        unready_nodes = get_unready_nodes(decommissioned_nodes, current_status)
        if len(unready_nodes) == 0:
            break
        unready_info = ','.join([node_name+" in "+status for node_name, status in unready_nodes.items()])
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


def validate_vc_name(vc_name_str):
    if re.match(r"^[A-Za-z0-9_]+$", vc_name_str) is None:
        raise argparse.ArgumentTypeError("invalid vc name: {}. Only alphanumeric and _ allowed".format(vc_name_str))
    return vc_name_str


def is_dedicated_vc(queue_name, queue_attr):
    # print(json.dumps(queue_attr, indent=2))
    if queue_name == "" or queue_name == "*" or queue_attr["defaultNodeLabelExpression"] != queue_name:
        return False
    if queue_name not in queue_attr["capacities"] or queue_attr["capacities"][queue_name]["maxCapacity"] != 100:
        return False
    return True


def get_resource_by_label(nodes_info):
    labels_dict = {}
    default_resource = Resource(**{"cpus": 0, "memory": 0, "gpus": 0})
    for node, info in nodes_info.items():
        if info["nodeLabel"] not in labels_dict:
            labels_dict[info["nodeLabel"]] = {
                "resource": default_resource
            }
        labels_dict[info["nodeLabel"]]["resource"] += info["resource"]
    return labels_dict


def get_dedicate_vc(args):
    yarn_operator = YarnOperator(args.resource_manager_ip)
    queues_info = yarn_operator.get_queues_info()
    nodes_info = yarn_operator.get_nodes_info()
    dedicate_queues = {queue_name: {"resource": Resource(**{"cpus": 0, "memory": 0, "gpus": 0}), "nodes": []} for queue_name, queue_info in queues_info.items() if
                       is_dedicated_vc(queue_name, queue_info)}
    if len(dedicate_queues) == 0:
        logger.info("No dedicated vc found")
        return

    labeled_resources = get_resource_by_label(nodes_info)
    for partition in labeled_resources:
        if partition in dedicate_queues:
            dedicate_queues[partition]["resource"] = labeled_resources[partition]["resource"]

    for node in nodes_info:
        if nodes_info[node]["nodeLabel"] in dedicate_queues:
            dedicate_queues[nodes_info[node]["nodeLabel"]]["nodes"].append(node)
    for queue_name, queue_attr in dedicate_queues.items():
        print(queue_name + ":")
        print("\tNodes: " + ",".join(queue_attr["nodes"]))
        print("\tResource: <CPUs:{}, Memory:{}MB, GPUs:{}>".format(queue_attr["resource"].cpus, queue_attr["resource"].memory, queue_attr["resource"].gpus))


def convert_percentage_to_gpus(queues_info, partition_resource):
    new_queues_info = copy.deepcopy(queues_info)
    for queue, info in new_queues_info.items():
        p = info["capacity"] / float(100)
        info["gpus"] = partition_resource.gpus * p
    return new_queues_info


def convert_gpus_to_percentage(queues_info, partition_resource):
    new_queues_info = copy.deepcopy(queues_info)
    if partition_resource.gpus > 0:
        for queue, info in new_queues_info.items():
            gpus = info["gpus"]
            info["capacity"] = float(gpus) / partition_resource.gpus * 100
    return new_queues_info


def normalize_percentage(queues_info):
    new_queues_info = copy.deepcopy(queues_info)
    sum_percentage = 0
    for queue, info in new_queues_info.items():
        sum_percentage += info["capacity"]

    if sum_percentage != 100:
        logger.warning("Renormalize percentage to 100%, current: {}%".format(sum_percentage))
    new_queues_info["default"]["capacity"] -= sum_percentage - 100

    for queue, info in new_queues_info.items():
        if queue != "default":
            info["maxCapacity"] = info["capacity"]

    return new_queues_info


def add_dedicate_vc(args):
    yarn_operator = YarnOperator(args.resource_manager_ip)
    restserver_operator = RestserverOperator(args.restserver_ip)
    vc_name = args.vc_name
    nodes = args.nodes

    logger.info("Adding cluster label...")
    existing_labels = yarn_operator.get_cluster_labels()
    if vc_name in existing_labels:
        logger.warning("Label already exists: {}".format(vc_name))
    else:
        yarn_operator.add_cluster_label(vc_name)

    logger.info("Adding dedicated vc...")
    queues_info = yarn_operator.get_queues_info()
    if vc_name in queues_info:
        logger.warning("Virtual cluster already exists: {}. Adding node to it".format(vc_name))
    else:
        restserver_operator.add_vc(vc_name)
        yarn_operator.add_dedicated_queue(vc_name)

    nodes_info = yarn_operator.get_nodes_info()
    if len(nodes) > 0:
        logger.info("Labeling node...")

        if queues_info["default"]["maxCapacity"] == 100 or queues_info["default"]["maxCapacity"] > \
                queues_info["default"]["capacity"]:
            queues_info["default"]["maxCapacity"] = 100.0

        added_resource = Resource(**{"cpus": 0, "memory": 0, "gpus": 0})
        for node, info in nodes_info.items():
            if node in nodes and info["nodeLabel"] == "":
                added_resource += info["resource"]

        default_partition_resource = get_resource_by_label(nodes_info)[""]["resource"]
        default_vc_percentage = queues_info["default"]["capacity"] / 100.0
        default_vc_resource = default_partition_resource * default_vc_percentage

        if default_vc_resource.cpus < added_resource.cpus \
            or default_vc_resource.gpus < added_resource.gpus \
                or default_vc_resource.memory < added_resource.memory:
            logger.error("Default vc resource isn't enough for the dedicated vc, please free some resource")
            sys.exit(1)

        new_default_partition_resource = default_partition_resource - added_resource
        new_default_vc_resource = default_vc_resource - added_resource

        queues_info_with_gpus = convert_percentage_to_gpus(queues_info, default_partition_resource)
        queues_info_with_gpus["default"]["gpus"] = new_default_vc_resource.gpus
        new_queues_percentage = convert_gpus_to_percentage(queues_info_with_gpus, new_default_partition_resource)
        new_queues_percentage = normalize_percentage(new_queues_percentage)
        updated_dict = {}
        for queue, info in new_queues_percentage.items():
            updated_dict[queue] = {
                "capacity": info["capacity"],
                "maximum-capacity": info["maxCapacity"]
            }
            if queue != "default":
                updated_dict[queue]["disable_preemption"] = True

        yarn_operator.label_nodes(nodes, vc_name)
        yarn_operator.update_queue_capacity(updated_dict)


def remove_dedicate_vc(args):
    yarn_operator = YarnOperator(args.resource_manager_ip)
    restserver_operator = RestserverOperator(args.restserver_ip)
    vc_name = args.vc_name
    nodes = args.nodes
    remove_queue_flag = nodes is None

    logger.info("Unlabeling node...")
    nodes_info = yarn_operator.get_nodes_info()
    queues_info = yarn_operator.get_queues_info()
    if nodes is None:
        nodes = set(nodes_info.keys())
    t_nodes = [node for node in nodes if nodes_info[node]["nodeLabel"] == vc_name]
    if len(t_nodes) > 0:

        if queues_info["default"]["maxCapacity"] == 100 or queues_info["default"]["maxCapacity"] > \
                queues_info["default"]["capacity"]:
            queues_info["default"]["maxCapacity"] = 100.0

        removed_resource = Resource(**{"cpus": 0, "memory": 0, "gpus": 0})
        for node, info in nodes_info.items():
            if node in nodes and info["nodeLabel"] == vc_name:
                removed_resource += info["resource"]

        default_partition_resource = get_resource_by_label(nodes_info)[""]["resource"]
        default_vc_percentage = queues_info["default"]["capacity"] / 100.0
        default_vc_resource = default_partition_resource * default_vc_percentage

        new_default_partition_resource = default_partition_resource + removed_resource
        new_default_vc_resource = default_vc_resource + removed_resource

        queues_info_with_gpus = convert_percentage_to_gpus(queues_info, default_partition_resource)
        queues_info_with_gpus["default"]["gpus"] = new_default_vc_resource.gpus
        new_queues_percentage = convert_gpus_to_percentage(queues_info_with_gpus, new_default_partition_resource)
        new_queues_percentage = normalize_percentage(new_queues_percentage)
        updated_dict = {}
        for queue, info in new_queues_percentage.items():
            updated_dict[queue] = {
                "capacity": info["capacity"],
                "maximum-capacity": info["maxCapacity"]
            }

        yarn_operator.label_nodes(t_nodes, "")
        yarn_operator.update_queue_capacity(updated_dict)

    if remove_queue_flag:
        logger.info("Removing dedicated vc...")
        if vc_name not in queues_info:
            logger.warning("Virtual cluster not found: {}.".format(vc_name))
        else:
            yarn_operator.remove_dedicated_queue(vc_name)
            restserver_operator.delete_vc(vc_name)

        logger.info("Removing cluster label...")
        if vc_name not in yarn_operator.get_cluster_labels():
            logger.warning("Cluster label not found: {}".format(vc_name))
        else:
            yarn_operator.remove_cluster_label(vc_name)

def setup_user(args):
    username = args.username
    password = args.password
    RestserverOperator.setup_user(username, password)
    logger.info("Setup user done")


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
    parent_parser.add_argument("--restserver-ip",
                               help="specify restserver ip separately, by default it's master node ip")
    parent_parser.add_argument("--prometheus-port", default=9091,
                               help="specify prometheus port, by default it's 9091")

    # setup restserver user
    user_parser = sub_parser.add_parser("user", help="query prometheus alerts")
    user_subparsers = user_parser.add_subparsers(dest="action")

    parser_set = user_subparsers.add_parser("set", parents=[parent_parser], help="print current gpu alerts")
    parser_set.add_argument("-u", "--username", required=True)
    parser_set.add_argument("-p", "--password", required=True)
    parser_set.set_defaults(func=setup_user)

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
    parser_add.add_argument("-n", "--nodes", type=convert_nodes, help="support comma-delimited node list", required=True)
    parser_add.set_defaults(func=add_decommission_nodes)

    parser_remove = blacklist_subparsers.add_parser("remove", parents=[parent_parser], help="remove nodes from blacklist")
    parser_remove.add_argument("-n", "--nodes", type=convert_nodes, help="support comma-delimited node list", required=True)
    parser_remove.set_defaults(func=remove_decommission_nodes)

    parser_update = blacklist_subparsers.add_parser("update", parents=[parent_parser], help="update blacklist")
    parser_update.add_argument("-n", "--nodes", type=convert_nodes, help="support comma-delimited node list")
    parser_update.set_defaults(func=update_decommission_nodes)

    parser_refresh = blacklist_subparsers.add_parser("enforce", parents=[parent_parser],
                                                    help="enforce yarn to gracefully decommission nodes in blacklist")
    parser_refresh.set_defaults(func=refresh_yarn_nodes)

    # dedicated vc parser
    dedicated_vc_parser = sub_parser.add_parser("dedicated-vc", help="operate dedicated vc")
    dedicated_vc_subparsers = dedicated_vc_parser.add_subparsers(dest="action")

    parser_get = dedicated_vc_subparsers.add_parser("get", parents=[parent_parser], help="get dedicate vc info")
    parser_get.set_defaults(func=get_dedicate_vc)

    parser_add = dedicated_vc_subparsers.add_parser("add", parents=[parent_parser], help="add dedicate vc")
    parser_add.add_argument("-n", "--nodes", type=convert_nodes, help="support comma-delimited node list", default={})
    parser_add.add_argument("-v", "--vc-name", type=validate_vc_name, required=True)
    parser_add.set_defaults(func=add_dedicate_vc)

    parser_remove = dedicated_vc_subparsers.add_parser("remove", parents=[parent_parser], help="remove dedicate vc")
    parser_remove.add_argument("-v", "--vc-name", type=validate_vc_name, required=True)
    parser_remove.add_argument("-n", "--nodes", type=convert_nodes, help="support comma-delimited node list")
    parser_remove.set_defaults(func=remove_dedicate_vc)

    return top_parser


def main():
    parser = setup_parser()
    args = parser.parse_args()
    args.resource_manager_ip = args.resource_manager_ip or args.master_ip
    args.api_server_ip = args.api_server_ip or args.master_ip
    args.prometheus_ip = args.prometheus_ip or args.master_ip
    args.restserver_ip = args.restserver_ip or args.master_ip
    try:
        args.func(args)
    except Exception as e:
        from subprocess import CalledProcessError
        if isinstance(e, CalledProcessError):
            logger.error(e.output)
        else:
            logger.exception(e)


if __name__ == "__main__":
    main()
