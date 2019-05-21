import logging
import sys
import os
import re
import json
from bs4 import BeautifulSoup
import xmltodict
import dicttoxml

from utility.common import request_without_exception, command_without_exception, safe_get

logger = logging.getLogger(__name__)



class YarnOperator(object):
    yarn_config_path = "./.hadoop"

    def __init__(self, master_ip):
        self.master_ip = master_ip
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
        yarn_nodes_url = "http://{}:8088/ws/v1/cluster/nodes".format(self.master_ip)
        response = request_without_exception(yarn_nodes_url)
        if response is None:
            sys.exit(1)

        nodes_info = response.json()
        current_nodes = {}
        for node in nodes_info["nodes"]["node"]:
            host, state = node["nodeHostName"], node["state"]
            current_nodes[host] = state
        return current_nodes

    def decommission_nodes(self):
        command = "yarn --config {} rmadmin -refreshNodes -g -server".format(self.yarn_config_path)
        output = command_without_exception(command)
        if output is None:
            sys.exit(1)

    def get_cluster_label(self):
        # Sample output: "Node Labels: <label_ex:exclusivity=true>,<label_non:exclusivity=false>"
        # Sample output: "Node Labels: "
        command = "yarn --config {} cluster --list-node-labels".format(self.yarn_config_path)

        command_output = command_without_exception(command)
        if command_output is None:
            sys.exit(1)

        lines = command_output.split("\n")
        labels = dict()  # key: label name, value: exclusivity
        for line in lines:
            if not line.startswith("Node Labels:"):
                continue
            line = line.lstrip("Node Labels:")
            labels_str = line.split(",")
            label_regex = r"<([a-zA-Z0-9][a-zA-Z0-9_\-]*):exclusivity=(true|false)>"
            for label_str in labels_str:
                match = re.search(label_regex, label_str)
                if match:
                    label_name, exclusivity = match.groups()
                    exclusivity = exclusivity == "true"
                    labels[label_name] = {"exclusive": exclusivity}

        return labels

    def add_cluster_label(self, labels):
        labels_list = []

        for label_name in labels:
            exclusivity = "true" if labels[label_name] else "false"
            label_str = "{}(exclusive={})".format(label_name, exclusivity)
            labels_list.append(label_str)

        labels_str = ",".join(labels_list)

        command = "yarn --config {} rmadmin -addToClusterNodeLabels \"{}\"".format(self.yarn_config_path, labels_str)
        command_output = command_without_exception(command)
        if command_output is None:
            sys.exit(1)

    def remove_cluster_label(self, labels):
        labels_str = ",".join(labels)   # Labels could be list, set or dict

        command = "yarn --config {} rmadmin -removeFromClusterNodeLabels {}".format(self.yarn_config_path, labels_str)
        command_output = command_without_exception(command)
        if command_output is None:
            sys.exit(1)

    def label_nodes(self, nodes):
        nodes_list = []

        for node in nodes:
            node_str = "{}={}".format(node, nodes[node])
            nodes_list.append(node_str)

        nodes_str = " ".join(nodes_list)

        # yarn rmadmin -replaceLabelsOnNode "node1[:port]=label1 node2=label2" [-failOnUnknownNodes]
        command = "yarn --config {} rmadmin -replaceLabelsOnNode \"{}\" -failOnUnknownNodes"\
            .format(self.yarn_config_path, nodes_str)
        command_output = command_without_exception(command)
        if command_output is None:
            sys.exit(1)

    def unlabel_nodes(self, nodes):
        nodes_list = []

        for node in nodes:
            node_str = "{}=".format(node)
            nodes_list.append(node_str)

        nodes_str = " ".join(nodes_list)

        command = "yarn --config {} rmadmin -replaceLabelsOnNode \"{}\" -failOnUnknownNodes" \
            .format(self.yarn_config_path, nodes_str)
        command_output = command_without_exception(command)
        if command_output is None:
            sys.exit(1)

    def get_node_label(self):
        yarn_nodes_url = "http://{}:8088/ws/v1/cluster/nodes".format(self.master_ip)
        response = request_without_exception(yarn_nodes_url)
        if response is None:
            sys.exit(1)

        nodes_info = response.json()
        current_nodes = {}
        for node in nodes_info["nodes"]["node"]:
            host = node["nodeHostName"]
            node_label = node.get("nodeLabels", [""])[0]
            current_nodes[host] = node_label
        return current_nodes

    def get_queue_info(self):
        yarn_scheduler_url = "http://{}:8088/ws/v1/cluster/scheduler".format(self.master_ip)
        response = request_without_exception(yarn_scheduler_url)
        if response is None:
            sys.exit(1)

        scheduler_info = response.json()

        def traverse(queue_info, result_dict):
            if queue_info["type"] == "capacitySchedulerLeafQueueInfo":
                result_dict[queue_info["queueName"]] = {
                    "capacity": queue_info["absoluteCapacity"],
                    "maxCapacity": queue_info["absoluteMaxCapacity"],
                    "usedCapacity": queue_info["absoluteUsedCapacity"],
                    "numActiveJobs": queue_info["numActiveApplications"],
                    "numJobs": queue_info["numApplications"],
                    "numPendingJobs": queue_info["numPendingApplications"],
                    "resourcesUsed": queue_info["resourcesUsed"],
                    "state": queue_info["state"],
                    "nodeLabels": queue_info["nodeLabels"],
                    "capacities": {
                        partitionCapacities["partitionName"]: {
                            "capacity": partitionCapacities["absoluteCapacity"],
                            "maxCapacity": partitionCapacities["absoluteMaxCapacity"],
                            "usedCapacity": partitionCapacities["absoluteUsedCapacity"],
                        }
                        for partitionCapacities in queue_info["capacities"]["queueCapacitiesByPartition"]
                    },
                    "preemptionDisabled": queue_info.get("preemptionDisabled", False),
                    "defaultNodeLabelExpression": queue_info.get("defaultNodeLabelExpression", ""),
                }
            elif queue_info["type"] == "capacityScheduler":
                for queue in queue_info["queues"]["queue"]:
                    traverse(queue, result_dict)
            else:
                logger.error("unsupported scheduler type: {}".format(queue_info["type"]))
                return

        queues = {}
        traverse(scheduler_info["scheduler"]["schedulerInfo"], queues)
        return queues

    def get_partition_resource(self):
        yarn_nodelabel_url = "http://{}:8088/cluster/nodelabels".format(self.master_ip)
        response = request_without_exception(yarn_nodelabel_url)
        if response is None:
            sys.exit(1)

        soup = BeautifulSoup(response.text, features="lxml")
        result = soup.find("table", id="nodelabels")
        tbody = result.find("tbody")
        labels = tbody.find_all("tr")
        labels_dict = {}
        for label in labels:
            label_dict = {}

            label_name_raw, exclusive_raw, active_nm_raw, resources_raw = label.find_all("td")
            label_name = label_name_raw.string.strip()
            if label_name == "<DEFAULT_PARTITION>":
                label_name = ""

            exclusive = exclusive_raw.string.strip()
            if exclusive == "Exclusive Partition":
                label_dict["exclusive"] = True
            elif exclusive == "Non Exclusive Partition":
                label_dict["exclusive"] = False
            else:
                logger.error("unknown exclusivity: {}".format(exclusive))
                sys.exit(1)

            if active_nm_raw.find('a'):
                active_nm = active_nm_raw.find('a').string.strip()
            else:
                active_nm = active_nm_raw.string.strip()
            label_dict["active_nm"] = int(active_nm)

            resources = resources_raw.string.strip()
            r_dict = {}
            for resource in resources.strip("<>").split(","):
                r_type, r_quota = resource.split(":")
                r_dict[r_type.strip()] = int(r_quota)
            label_dict["resource"] = r_dict
            labels_dict[label_name] = label_dict
        return labels_dict

    def add_dedicated_queue(self, label_name):
        pass

    def remove_dedicated_queue(self, label_name):
        pass



    def generate_queue_update_xml(self, g_dict):
        return dicttoxml.dicttoxml(g_dict, attr_type=False, custom_root="sched-conf", item_func=lambda x: "entry")

    def post_queue_update_xml(self, update_xml):
        yarn_scheduler_conf_url = "http://{}:8088/ws/v1/cluster/scheduler-conf".format(self.master_ip)
        headers = {"Content-Type": "application/xml"}
        request_without_exception(yarn_scheduler_conf_url, method="put", headers=headers, data=update_xml)


if __name__ == "__main__":
    yarn_op = YarnOperator("10.151.40.133")
    # yarn_op.get_partition_resource()
    # print(json.dumps(yarn_op.get_queue_info(), indent=2))
    from collections import OrderedDict
    raw_dict = OrderedDict([
        ("global-updates", [
            OrderedDict([("key", "yarn.scheduler.capacity.root.default.default-node-label-expression"),
                        ("value", "label_non")]),
            OrderedDict([("key", "yarn.scheduler.capacity.root.default.accessible-node-labels.label_ex.capacity"),
                         ("value", 0)]),

        ])
    ])

    # raw_dict = {
    #     "global-updates":
    #         [
    #
    #             {
    #                 "key": "yarn.scheduler.capacity.root.default.default-node-label-expression",
    #                 "value": "label_non"
    #             },
    #             {
    #                 "key": "yarn.scheduler.capacity.root.default.accessible-node-labels.label_ex.capacity",
    #                 "value": 0
    #             }
    #
    #         ]
    # }
    from xml.dom.minidom import parseString

    dom = parseString(yarn_op.generate_queue_update_xml(raw_dict))
    print(dom.toprettyxml())
