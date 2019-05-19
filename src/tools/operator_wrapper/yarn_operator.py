import requests
import logging
import sys
import os
import subprocess
import re

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
        try:
            response = requests.get(yarn_nodes_url, timeout=10)
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
        command = "yarn --config {} rmadmin -refreshNodes -g -server".format(self.yarn_config_path)
        try:
            subprocess.check_output(command, stderr=subprocess.STDOUT, shell=True)
        except subprocess.CalledProcessError as e:
            logger.error(e.output)
            sys.exit(1)

    def get_cluster_label(self):
        # Sample output: "Node Labels: <label_ex:exclusivity=true>,<label_non:exclusivity=false>"
        # Sample output: "Node Labels: "
        command = "yarn --config {} cluster --list-node-labels".format(self.yarn_config_path)

        try:
            command_output = subprocess.check_output(command, shell=True).decode("utf8")
        except subprocess.CalledProcessError as e:
            logger.error(e.output)
            return {}

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
                    labels[label_name] = exclusivity

        return labels

    def add_cluster_label(self, labels):
        labels_list = []

        for label_name in labels:
            exclusivity = "true" if labels[label_name] else "false"
            label_str = "{}(exclusive={})".format(label_name, exclusivity)
            labels_list.append(label_str)

        labels_str = ",".join(labels_list)

        command = "yarn --config {} rmadmin -addToClusterNodeLabels \"{}\"".format(self.yarn_config_path, labels_str)
        try:
            subprocess.check_output(command, stderr=subprocess.STDOUT, shell=True).decode("utf8")
        except subprocess.CalledProcessError as e:
            logger.error(e.output)
            sys.exit(1)

    def remove_cluster_label(self, labels):
        labels_str = ",".join(labels)   # Labels could be list, set or dict

        command = "yarn --config {} rmadmin -removeFromClusterNodeLabels {}".format(self.yarn_config_path, labels_str)
        try:
            subprocess.check_output(command, stderr=subprocess.STDOUT, shell=True).decode("utf8")
        except subprocess.CalledProcessError as e:
            logger.error(e.output)
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
        try:
            subprocess.check_output(command, stderr=subprocess.STDOUT, shell=True).decode("utf8")
        except subprocess.CalledProcessError as e:
            logger.error(e.output)
            sys.exit(1)

    def unlabel_nodes(self, nodes):
        nodes_list = []

        for node in nodes:
            node_str = "{}=".format(node)
            nodes_list.append(node_str)

        nodes_str = " ".join(nodes_list)

        command = "yarn --config {} rmadmin -replaceLabelsOnNode \"{}\" -failOnUnknownNodes" \
            .format(self.yarn_config_path, nodes_str)
        try:
            subprocess.check_output(command, stderr=subprocess.STDOUT, shell=True).decode("utf8")
        except subprocess.CalledProcessError as e:
            logger.error(e.output)
            sys.exit(1)

    def get_node_label(self):
        yarn_nodes_url = "http://{}:8088/ws/v1/cluster/nodes".format(self.master_ip)
        try:
            response = requests.get(yarn_nodes_url, timeout=10)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            logger.exception(e)
            sys.exit(1)

        nodes_info = response.json()
        current_nodes = {}
        for node in nodes_info["nodes"]["node"]:
            host = node["nodeHostName"]
            node_label = node.get("nodeLabels", "")
            current_nodes[host] = node_label
        return current_nodes

    def _generate_queue_xml(self, g):
        pass