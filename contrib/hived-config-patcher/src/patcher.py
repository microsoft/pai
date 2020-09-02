# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

import sys
import yaml
import logging
import argparse
from kubernetes import client, config, watch


class HiveDConfigPatcher(object):
    def __init__(self, min_nodes=1, max_nodes=2**31-1, hived_config_file=None):
        logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
        self.min_nodes = min_nodes
        self.max_nodes = max_nodes
        self.hived_config_file = hived_config_file
        self.__init_hived_config()
        self.__init_kube_client()
        self.__nodes = []
        self.__fake_nodes = ["fake{}".format(self.base36(i)) for i in range(max_nodes)]

    def __init_hived_config(self):
        if self.hived_config_file is None:
            logging.error("Cannot find hived config file, exit.")
            sys.exit(1)
        try:
            with open(self.hived_config_file, "r") as f:
                self.__hived_config = yaml.load(f)
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
            config.load_kube_config("../config.log")
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
        return nodes[:self.max_nodes] + self.__fake_nodes[len(nodes):]

    def list_nodes(self):
        ret = self.__client.list_node(watch=False)
        self.__nodes = [item.metadata.name for item in ret.items]
        logging.info("List nodes: %s.", self.__nodes)
        self.update_hived_config()

    def watch_nodes(self):
        w = watch.Watch()
        for event in w.stream(self.__client.list_node, _request_timeout=30):
            if event["type"] == "ADDED":
                logging.info("Watch event: %s node %s.", event["type"], event["object"].metadata.name)
                if event["object"].metadata.name not in self.__nodes:
                    self.__nodes.append(event["object"].metadata.name)
                    self.update_hived_config()
            elif event["type"] == "DELETED":
                logging.info("Watch event: %s node %s.", event["type"], event["object"].metadata.name)
                if event["object"].metadata.name in self.__nodes:
                    self.__nodes.remove(event["object"].metadata.name)
                    self.update_hived_config()
            else:
                continue

    def update_hived_config(self):
        all_nodes = self.pad_fake_nodes(sorted(self.__nodes))
        self.__hived_config["physicalCluster"]["physicalCells"][0]["cellChildren"] = \
            [{"cellAddress": node} for node in all_nodes]
        logging.info("Update hived config with nodes: %s.", all_nodes)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="HiveD config patcher for Cluster Autoscaler.")
    parser.add_argument("--max-nodes", type=int, help="maximum node number for CA")
    parser.add_argument("--hived-config-file", help="hived configuration file path")
    args = parser.parse_args()

    patcher = HiveDConfigPatcher(
        max_nodes=args.max_nodes,
        hived_config_file=args.hived_config_file)
    while True:
        try:
            patcher.list_nodes()
            patcher.watch_nodes()
        except Exception:
            logging.exception("Exception occurs when watch.")
            continue
