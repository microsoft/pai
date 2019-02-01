import requests
import logging
import os
import argparse
import time

from deployment.paiLibrary.common.kubernetes_handler import get_configmap
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



class PaiOperator(object):

    kubernetes_template = "../deployment/k8sPaiLibrary/template/config.template"
    kube_config_path = os.path.expanduser("~/.kube/config")
    configmap_name = "exclude-file"

    def __init__(self, master_ip):
        self.yarn_nodes_url = "http://{}:8088/ws/v1/cluster/nodes".format(master_ip)
        self.setup_kubernetes_configfile(master_ip)
        self.current_nodes = {}
        self.expect_nodes = {}


    def setup_kubernetes_configfile(self, api_servers_ip):

        template_data = common.read_template(self.kubernetes_template)
        dict_map = {
            "cluster_cfg": { "kubernetes": {"api-servers-ip": api_servers_ip}},
        }
        generated_data = common.generate_from_template_dict(template_data, dict_map)

        common.write_generated_file(generated_data, self.kube_config_path)

    def load_current_status(self):
        try:
            response = requests.get(self.yarn_nodes_url)
        except Exception as e:
            logger.exception(e)
            exit(1)

        if response.status_code != requests.codes.ok:
            logger.error("Response error: {}".format(response.text))
            exit(1)
        nodes_info = response.json()
        for node in nodes_info["nodes"]["node"]:
            host, state = node["nodeHostName"], node["state"]
            self.current_nodes[host] = state

    def load_configmap(self):
        decommision_nodes = get_configmap(self.kube_config_path, self.configmap_name)
        logger.debug(decommision_nodes)



    def get_expect_nodes(self):
        self.load_configmap()
        return self.expect_nodes.copy()


    def get_current_nodes(self):
        self.load_current_status()
        return self.current_nodes.copy()




def get_unready_nodes(expect_nodes, current_nodes):
    unready_nodes = {}
    for host, state in expect_nodes:
        if host in current_nodes \
                and current_nodes[host] not in state:
            unready_nodes[host] = state
    return unready_nodes


def main():
    parser = argparse.ArgumentParser()

    parser.add_argument("-p", "--master_ip", dest="ip", default="localhost", help="Master ip")

    args = parser.parse_args()

    master_ip = args.ip

    pai_operator = PaiOperator(master_ip)

    while True:
        expect_nodes = pai_operator.get_expect_nodes()
        expect_nodes = {host: ["DECOMMISSIONED", "DECOMMISSIONING"] for host in expect_nodes}
        current_nodes = pai_operator.get_current_nodes()
        if len(get_unready_nodes(expect_nodes, current_nodes)) == 0:
            break
        time.sleep(5)

    logger.info("All nodes is decommissioning or decommissioned")



if __name__ == "__main__":
    logger = setup_logger()
    pai_operator = PaiOperator("10.130.137.50")
    pai_operator.load_configmap()

    # main()
