import os

from kubernetes import client as kube_client, config as kube_config

KUBE_APISERVER_ADDRESS = "KUBE_APISERVER_ADDRESS"


class Collector:
    def __init__(self):
        kube_apiserver_address = os.environ.get(KUBE_APISERVER_ADDRESS, None)
        if kube_apiserver_address:
            config = kube_client.Configuration()
            config.host = kube_apiserver_address
            self._api_client = kube_client.ApiClient(config)
        else:
            kube_config.load_incluster_config()
            self._api_client = None

    def collect_pods_info(self):
        return kube_client.CoreV1Api(
            self._api_client).list_pod_for_all_namespaces()

    def collect_nodes_info(self):
        return kube_client.CoreV1Api(self._api_client).list_node()

    def collect_orphan_priority_class(self):
        # Here we list the priory classes
        return kube_client.AppsV1beta1Api(self._api_client)
