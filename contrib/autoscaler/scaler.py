import time
import yaml
import argparse

from utils import Logger, Shell
from nodes import WorkerNodeDict
from agents import K8SAgent, AzureAgent, OpenPaiAgent


class OpenPaiScaler(object):

    def __init__(self, config_path='config.yaml', time_interval=300, min_machine_num=5):
        self._logger = Logger()
        shell = Shell(self._logger)
        with open(config_path, 'r') as f:
            config=yaml.load(f, yaml.SafeLoader)
        self._pai = OpenPaiAgent(rest_uri=config['pai_rest_server_uri'], token=config['pai_bearer_token'])
        self._k8s = K8SAgent(shell)
        self._azure = AzureAgent(shell)
        self._nodes = WorkerNodeDict()
        self._time_interval = time_interval
        self._min_machine_num = min_machine_num

    def _get(self, x: str):
        if x == 'available_nodes':
            result = self._nodes.get_available_nodes()
        elif x == 'free_nodes':
            result = self._nodes.get_free_nodes()
        elif x == 'deallocated_nodes':
            result = self._nodes.get_deallocated_nodes()
        elif x == 'has_pod_nodes':
            result = self._nodes.get_has_pod_nodes()
        elif x == 'if_resource_not_guaranteed':
            result = self._pai.get_if_resource_not_guaranteed()
        elif x == 'if_valid_waiting_pod_exists':
            result = self._k8s.get_if_valid_waiting_pod_exists(self._pai.get_fully_used_vc_set())
        else:
            result = None

        ts = int(time.time())
        try:
            self._logger.info('polling ts = {}, {} = {}, count = {}'.format(ts, x, result, len(result)))
        except TypeError:
            self._logger.info('polling ts = {}, {} = {}'.format(ts, x, result))

        return result

    def _before_scaling(self):  # TODO tell openpai / HiveD to keep idle when scaling??
        pass

    def _after_scaling(self):
        pass

    def _scale(self):
        self._nodes = self._k8s.get_worker_nodes()
        # self._nodes = self._azure.get_worker_nodes(self._nodes)
        if self._get('if_valid_waiting_pod_exists'):
            should_be_started_nodes = self._get('has_pod_nodes')
            self._k8s.uncordon_nodes_no_wait(should_be_started_nodes)
        else:
            should_be_deallocated_nodes = self._get('free_nodes')[:len(self._get('available_nodes')) - self._min_machine_num]
            if should_be_deallocated_nodes:
                self._k8s.cordon_nodes_no_wait(should_be_deallocated_nodes)
    
    def start(self):
        while True:
            self._before_scaling()
            self._scale()
            self._after_scaling()
            time.sleep(self._time_interval)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--cluster-config', '-c', help='cluster config file', default='config.yaml')
    args = parser.parse_args()

    OpenPaiScaler(config_path=args.cluster_config).start()
