import logging
import argparse
import time
import re

from operator_wrapper import AlertOperator, KubernetesOperator, YarnOperator


def setup_logger():
    global logger
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.DEBUG)
    ch = logging.StreamHandler()
    ch.setLevel(logging.DEBUG)
    formatter = logging.Formatter('[%(asctime)s] %(name)s:%(levelname)s: %(message)s')
    ch.setFormatter(formatter)
    logger.addHandler(ch)
    return logger


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
