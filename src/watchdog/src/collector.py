import logging
import os
import urllib.parse

from kubernetes import client as kube_client, config as kube_config
import requests

KUBE_APISERVER_ADDRESS = "KUBE_APISERVER_ADDRESS"
DEFAULT_TOKEN_FILE = "/var/run/secrets/kubernetes.io/serviceaccount/token"
DEFAULT_CERT_FILE = "/var/run/secrets/kubernetes.io/serviceaccount/ca.crt"

# k8s will set following environment variables for pod.
# refer to https://kubernetes.io/docs/tasks/access-application-cluster/access-cluster/
KUBE_INCLUSTER_HOST = "KUBERNETES_SERVICE_HOST"
KUBE_INCLUSTER_PORT = "KUBERNETES_SERVICE_PORT"

LOGGER = logging.getLogger(__name__)


class Collector:
    def __init__(self):
        kube_apiserver_address = os.environ.get(KUBE_APISERVER_ADDRESS, None)
        if kube_apiserver_address:
            config = kube_client.Configuration()
            config.host = kube_apiserver_address
            self._kube_apiserver_address = "https://{}:{}".format(
                os.environ.get(KUBE_INCLUSTER_HOST),
                os.environ.get(KUBE_INCLUSTER_PORT))
            self._api_client = kube_client.ApiClient(config)
        else:
            self._kube_apiserver_address = kube_apiserver_address
            kube_config.load_incluster_config()
            self._api_client = None

        self._ca_path = self._headers = None
        if os.path.isfile(DEFAULT_CERT_FILE):
            self._ca_path = DEFAULT_CERT_FILE
        if os.path.isfile(DEFAULT_TOKEN_FILE):
            with open(DEFAULT_TOKEN_FILE, 'r') as f:
                bearer = f.read()
                self._headers = {'Authorization': "Bearer {}".format(bearer)}

    def collect_pods_info(self):
        return kube_client.CoreV1Api(
            self._api_client).list_pod_for_all_namespaces()

    def collect_nodes_info(self):
        return kube_client.CoreV1Api(self._api_client).list_node()

    def collect_orphan_priority_class(self):
        # Here we list the priory classes
        return kube_client.AppsV1beta1Api(self._api_client)

    def collect_api_server_health(self):
        error = "ok"
        try:
            error = requests.get("{}/{}".format(self._kube_apiserver_address,
                                                "healthz"),
                                 headers=self._headers,
                                 verify=self._ca_path).text
            return error
        except requests.RequestException as e:
            LOGGER.exception("requesting %s failed",
                             self._kube_apiserver_address)
            raise e

    def get_kube_api_server_hotname(self):
        return urllib.parse.urlparse(self._kube_apiserver_address).hostname
