import requests
from abc import abstractmethod
from kubernetes import client, config

from utils import Shell
from nodes import WorkerNodeDict


class CloudAgent:

    def __init__(self, shell: Shell):
        self._shell = shell

    @abstractmethod
    def get_worker_nodes(self):
        pass

    @abstractmethod
    def start_instance_no_wait(self, instance_ids: list):
        pass

    @abstractmethod
    def deallocate_instance_no_wait(self, instance_ids: list):
        pass
    
    def _execute(self, command: str):
        return self._shell.execute(command)


class K8SAgent(CloudAgent):
    '''a k8s client running locally'''

    def __init__(self, shell):
        super().__init__(shell)
        config.load_kube_config()
        self.K8SV1 = client.CoreV1Api()

    def get_worker_nodes(self, nodes: WorkerNodeDict = WorkerNodeDict()) -> WorkerNodeDict:

        status_table, _ = self._execute('kubectl get nodes')
        status_table = {line.split()[0]: line.split()[1] for line in status_table.split('\n')[1:-1]}
        for node in self.K8SV1.list_node(label_selector='pai-worker=true').items:
            name = node.metadata.name
            ip = node.status.addresses[0].address
            # is_ready = any([condition.type == 'Ready' and condition.status == 'True' for condition in node.status.conditions])
            is_ready = status_table[name] == 'Ready'
            nodes[ip].k8s_name = name
            nodes[ip].k8s_is_ready = is_ready

        for pod in self.K8SV1.list_namespaced_pod('default', label_selector='type=kube-launcher-task').items:
            if pod.status.host_ip:
                nodes[ip].k8s_pod_num += 1
                nodes[ip].vc = pod.metadata.labels['virtualCluster']

        return nodes

    def start_instance_no_wait(self, instance_ids):
        self._execute('kubectl uncordon {}'.format(
            ' '.join(instance_ids)
        ))

    def deallocate_instance_no_wait(self, instance_ids):
        self._execute('kubectl cordon {}'.format(
            ' '.join(instance_ids)
        ))

    def get_if_valid_waiting_pod_exists(self, fully_used_vc_set):
        for pod in self.K8SV1.list_namespaced_pod('default', label_selector='type=kube-launcher-task').items:
            vc = pod.metadata.labels['virtualCluster']
            if pod.status.phase == 'Pending' and pod.status.conditions[0].reason == 'Unschedulable':
                if vc not in fully_used_vc_set:
                    return True
        return False


class AzureAgent(CloudAgent):

    def __init__(self, shell):
        super().__init__(shell)
        # TODO: az login

    def get_worker_nodes(worker_nodes: WorkerNodeDict = WorkerNodeDict()) -> WorkerNodeDict:
        pass

    def start_instance_no_wait(self, instance_ids):
        self._execute('az vmss start --no-wait --name pai-worker --resource-group pai-worker_group --instance-ids {}'.format(
            ' '.join(instance_ids)
        ))

    def deallocate_instance_no_wait(self, instance_ids):
        self._execute('az vmss deallocate --no-wait --name pai-worker --resource-group pai-worker_group --instance-ids {}'.format(
            ' '.join(instance_ids)
        ))


class OpenPaiAgent:

    def __init__(self, rest_uri: str, token: str) -> None:
        self._rest_uri = rest_uri
        self._token = token

    def _get_vc(self):
        r = requests.get(
            '{}/api/v2/virtual-clusters'.format(self._rest_uri),
            headers={
                'Authorization': 'Bearer {}'.format(self._token)
            },
        )
        r.raise_for_status()
        response = r.json()
        return response
    
    def not_full(self, stats):
        return stats['resourcesGuaranteed']['GPUs'] != stats['resourcesTotal']['GPUs']

    def get_if_resource_not_guaranteed(self):
        return any([self.not_full(stats) for stats in self._get_vc().values()])

    def get_fully_used_vc_set(self):
        return set([stats for stats in self._get_vc().values() if self.not_full(stats)])
