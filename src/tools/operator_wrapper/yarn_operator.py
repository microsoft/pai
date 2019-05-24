import logging
import sys
import os
import re
import json
from bs4 import BeautifulSoup
import dicttoxml
dicttoxml.LOG.setLevel(logging.ERROR)
import time

from base_operator import BaseOperator

logger = logging.getLogger(__name__)


class YarnOperator(BaseOperator):
    yarn_config_path = "./.hadoop"

    def __init__(self, master_ip, port=8088):
        super(YarnOperator, self).__init__(master_ip, port)
        self.setup_yarn_configfile()

    def setup_yarn_configfile(self):
        if not os.path.exists(self.yarn_config_path):
            os.mkdir(self.yarn_config_path)

        yarn_config_str = \
        '''<configuration>
            <property>
                <name>yarn.resourcemanager.hostname</name>
                <value>{}</value>
            </property>
        </configuration>'''.format(self.master_ip)

        with open(os.path.join(self.yarn_config_path, "yarn-site.xml"), 'w') as f:
            f.write(yarn_config_str)

    def get_nodes_info(self):
        api_path = "/ws/v1/cluster/nodes"
        nodes_info = self.request(api_path)
        current_nodes = {}
        for node in nodes_info["nodes"]["node"]:
            host = node["nodeHostName"]
            state = node["state"]
            node_label = node.get("nodeLabels", [""])[0]
            current_nodes[host] = {
                "state":  state,
                "nodeLabel": node_label
            }
        return current_nodes

    def decommission_nodes(self):
        command = "yarn --config {} rmadmin -refreshNodes -g -server".format(self.yarn_config_path)
        self.execute(command)

    def get_cluster_labels(self):
        # Sample output: "Node Labels: <label_ex:exclusivity=true>,<label_non:exclusivity=false>"
        # Sample output: "Node Labels: "
        command = "yarn --config {} cluster --list-node-labels".format(self.yarn_config_path)

        output = self.execute(command)

        lines = output.split("\n")
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

    def add_cluster_label(self, label, exclusivity=True):

        label_str = "{}(exclusive={})".format(label, "true" if exclusivity else "false")

        command = "yarn --config {} rmadmin -addToClusterNodeLabels \"{}\"".format(self.yarn_config_path, label_str)
        self.execute(command)

    def remove_cluster_label(self, label):

        command = "yarn --config {} rmadmin -removeFromClusterNodeLabels {}".format(self.yarn_config_path, label)
        self.execute(command)

    def label_nodes(self, nodes, label):
        if isinstance(nodes, str):
            nodes = [nodes]

        nodes_str_builder = []

        for node in nodes:
            node_str = "{}={}".format(node, label)
            nodes_str_builder.append(node_str)

        nodes_str = " ".join(nodes_str_builder)

        # yarn rmadmin -replaceLabelsOnNode "node1[:port]=label1 node2=label2" [-failOnUnknownNodes]
        command = "yarn --config {} rmadmin -replaceLabelsOnNode \"{}\" -failOnUnknownNodes"\
            .format(self.yarn_config_path, nodes_str)

        self.execute(command)

    def get_queues_info(self):
        api_path = "/ws/v1/cluster/scheduler"
        scheduler_info = self.request(api_path)

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

    def get_resource_by_label(self):
        api_path = "/cluster/nodelabels"
        html_text = self.request(api_path, return_json=False)

        soup = BeautifulSoup(html_text)
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
            label_dict["resource"] = {
                "cpus": r_dict["vCores"],
                "memory": r_dict["memory"],
                "gpus": r_dict["GPUs"]
            }
            labels_dict[label_name] = label_dict
        return labels_dict

    def add_dedicated_queue(self, label_name):

        raw_dict = {
            "add-queue": {
                "queue-name": "root.{}".format(label_name),
                "params": [
                    {
                        "key": "capacity",
                        "value": 0
                    },
                    {
                        "key": "maximum-capacity",
                        "value": 0
                    },
                    {
                        "key": "default-node-label-expression",
                        "value": label_name
                    },
                    {
                        "key": "accessible-node-labels",
                        "value": label_name
                    },
                    {
                        "key": "disable_preemption",
                        "value": True
                    },
                    {
                        "key": "maximum-applications",
                        "value": 10000
                    },
                    {
                        "key": "user-limit-factor",
                        "value": 100
                    }
                ]

            },
            "global-updates": [
                {
                    "key": "yarn.scheduler.capacity.root.accessible-node-labels.{}.capacity".format(label_name),
                    "value": 100
                },
                {
                    "key": "yarn.scheduler.capacity.root.{vc_name}.accessible-node-labels.{vc_name}.capacity".format(vc_name=label_name),
                    "value": 100
                }
            ]
        }
        request_xml = self.generate_queue_update_xml(raw_dict)

        self.put_queue_update_xml(request_xml)

    def remove_dedicated_queue(self, label_name):

        raw_dict = {
            "update-queue": {
                "queue-name": "root.{}".format(label_name),
                "params": [
                    {
                        "key": "state",
                        "value": "STOPPED"
                    }
                ]

            },
        }
        request_xml = self.generate_queue_update_xml(raw_dict)

        self.put_queue_update_xml(request_xml)
        while True:
            current_state = self.get_queues_info()[label_name]["state"]
            if current_state == "STOPPED":
                break
            logger.info("current vc status: {}. waiting...".format(current_state))
            time.sleep(5)

        raw_dict = {
            "remove-queue": "root.{}".format(label_name),
            "global-updates": [
                {
                    "key": "yarn.scheduler.capacity.root.accessible-node-labels.{vc_name}.capacity".format(vc_name=label_name),
                    "value": 0
                }
            ]
        }
        request_xml = self.generate_queue_update_xml(raw_dict)

        self.put_queue_update_xml(request_xml)


    def generate_queue_update_xml(self, g_dict):
        return dicttoxml.dicttoxml(g_dict, attr_type=False, custom_root="sched-conf", item_func=lambda x: "entry")

    def put_queue_update_xml(self, update_xml):
        api_path = "/ws/v1/cluster/scheduler-conf"
        headers = {"Content-Type": "application/xml"}
        # from xml.dom.minidom import parseString
        #
        # dom = parseString(update_xml)
        # logger.debug(dom.toprettyxml())
        self.request(api_path, method="put", return_json=False, headers=headers, data=update_xml)


if __name__ == "__main__":
    yarn_op = YarnOperator("10.151.40.133")
    print yarn_op.execute("yarn")
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
