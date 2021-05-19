from abc import abstractmethod
from kubernetes import client, config

from utils import Shell
from nodes import WorkerNode, Pod


class InfrMonitor(object):

    def __init__(self):
        self._nodes = []
        self._pods = []
        self._node_ip_mapping = {}

    @abstractmethod
    def _update_nodes(self):
        raise NotImplementedError

    @abstractmethod
    def _update_pods(self):
        raise NotImplementedError
    
    def refresh(self):
        self._update_nodes()
        self._update_pods()

    def get_nodes(self) -> list:
        return self._nodes
    
    def get_node_by_ip(self, ip: str) -> WorkerNode:
        return self._nodes[self._node_ip_mapping[ip]]

    def get_pods(self) -> list:
        return self._pods


class K8SMonitor(InfrMonitor):
    '''a k8s client running locally'''

    def __init__(self, shell: Shell):
        super().__init__()
        self._shell = shell
        config.load_kube_config()
        self._K8SV1 = client.CoreV1Api()

    def _update_nodes(self):
        self._nodes = []
        self._node_ip_mapping = {}
        status_table, _ = self._shell.execute('kubectl get nodes')
        status_table = {line.split()[0]: line.split()[1] for line in status_table.split('\n')[1:-1]}
        for i, node in enumerate(self._K8SV1.list_node(label_selector='pai-worker=true').items):
            ip = node.status.addresses[0].address
            name = node.metadata.name
            is_ready = status_table[name] == 'Ready'
            # is_ready = any([condition.type == 'Ready' and condition.status == 'True' for condition in node.status.conditions])
            self._nodes.append(WorkerNode(ip=ip, k8s_name=name, k8s_is_ready=is_ready))
            self._node_ip_mapping[ip] = i

    def _update_pods(self):
        self._pods = []
        for pod in self._K8SV1.list_namespaced_pod('default', label_selector='type=kube-launcher-task').items:
            vc = pod.metadata.labels['virtualCluster']
            host_ip = pod.status.host_ip
            pending = pod.status.phase == 'Pending' and pod.status.conditions[0].reason == 'Unschedulable'
            self._pods.append(Pod(vc=vc, host_ip=host_ip, pending=pending))
            if host_ip:
                node = self.get_node_by_ip(host_ip)
                node.k8s_pod_num += 1
                node.vc = vc
