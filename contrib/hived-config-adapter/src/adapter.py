# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

import sys
import yaml
import logging
import argparse
from kubernetes import client, config, watch


class HiveDConfigAdapter(object):
    def __init__(
            self,
            min_nodes=None,
            max_nodes=None,
            node_name_prefix=None,
            hived_configmap=None,
            hived_config_file=None,
            kube_config_file=None):
        logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
        self.min_nodes = min_nodes or 1
        self.max_nodes = max_nodes or 2**31 - 1
        self.node_name_prefix = node_name_prefix or ""
        self.hived_configmap = hived_configmap or "hivedscheduler-config"
        self.hived_config_file = hived_config_file
        self.kube_config_file = kube_config_file
        self.__init_hived_config()
        self.__init_kube_client()
        self.__nodes = set()
        self.__fake_nodes = ["fake{}".format(self.base36(i)) for i in range(max_nodes)]

    def __init_hived_config(self):
        if self.hived_config_file is None:
            logging.error("Cannot find hived config file, exit.")
            sys.exit(1)
        try:
            with open(self.hived_config_file, "r") as f:
                self.__hived_config = yaml.load(f, yaml.Loader)
        except Exception:
            logging.error("Cannot load hived config, exit.")
            sys.exit(1)
        if ("physicalCluster" not in self.__hived_config or
                "physicalCells" not in self.__hived_config["physicalCluster"] or
                len(self.__hived_config["physicalCluster"]["physicalCells"]) == 0):
            logging.error("Invalid hived config, exit.")
            sys.exit(1)

    def __init_kube_client(self):
        try:
            if self.kube_config_file is not None:
                config.load_kube_config(self.kube_config_file)
            else:
                config.load_incluster_config()
        except Exception:
            logging.error("Cannot load kube config, exit.")
            sys.exit(1)
        self.__client = client.CoreV1Api()

    def base36(self, num):
        def itoa(n):
            return chr(n + ord("0")) if (0 <= n <= 9) else chr(n - 10 + ord("A"))
        base, str36 = 36, ""
        while num > 0:
            str36 += itoa(num % base)
            num = num // base
        return str36[::-1].zfill(6)

    def pad_fake_nodes(self, nodes):
        if len(nodes) > self.max_nodes:
            logging.warn(
                "Nodes number %s > max nodes %s, removing nodes %s.",
                len(nodes), self.max_nodes, nodes[self.max_nodes:])
        return nodes[:self.max_nodes] + self.__fake_nodes[len(nodes):]

    def list_nodes(self):
        ret = self.__client.list_node(watch=False)
        self.__nodes = set(
            [item.metadata.name for item in ret.items if item.metadata.name.startswith(self.node_name_prefix)])
        logging.info("List nodes: %s.", sorted(self.__nodes))
        self.update_hived_config()

    def watch_nodes(self):
        w = watch.Watch()
        for event in w.stream(self.__client.list_node):
            event_type, node_name = event["type"], event["object"].metadata.name
            if event_type == "ADDED":
                logging.info("Watch event: %s node %s.", event_type, node_name)
                if node_name.startswith(self.node_name_prefix) and node_name not in self.__nodes:
                    self.__nodes.add(node_name)
                    self.update_hived_config()
            elif event_type == "DELETED":
                logging.info("Watch event: %s node %s.", event_type, node_name)
                if node_name.startswith(self.node_name_prefix) and node_name in self.__nodes:
                    self.__nodes.discard(node_name)
                    self.update_hived_config()
            else:
                continue

    def update_hived_config(self):
        all_nodes = self.pad_fake_nodes(sorted(self.__nodes))
        self.__hived_config["physicalCluster"]["physicalCells"][0]["cellChildren"] = \
            [{"cellAddress": node} for node in all_nodes]
        logging.info("Update hived config with nodes: %s.", all_nodes)
        self.__client.patch_namespaced_config_map(
            name=self.hived_configmap,
            namespace="default",
            body={"data": {"hivedscheduler.yaml": yaml.dump(self.__hived_config)}})


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="HiveD config adapter for Cluster Autoscaler.")
    parser.add_argument("--min-nodes", type=int, required=False, help="minimum node number for CA")
    parser.add_argument("--max-nodes", type=int, required=False, help="maximum node number for CA")
    parser.add_argument("--node-name-prefix", required=False, help="node name prefix for workers")
    parser.add_argument("--hived-config-file", required=False, help="hived configuration file path")
    parser.add_argument("--kube-config-file", required=False, help="kube config file path")
    args = parser.parse_args()

    adapter = HiveDConfigAdapter(
        min_nodes=args.min_nodes,
        max_nodes=args.max_nodes,
        node_name_prefix=args.node_name_prefix,
        hived_config_file=args.hived_config_file,
        kube_config_file=args.kube_config_file)
    while True:
        try:
            adapter.list_nodes()
            adapter.watch_nodes()
        except Exception:
            logging.exception("Exception occurs when watch.")
            continue
