import time
import yaml
import argparse
from abc import abstractmethod

from utils import Logger, Shell
from nodes import WorkerNode, Pod
from app_monitors import AppMonitor, OpenPaiMonitor
from infr_monitors import InfrMonitor, K8SMonitor
from cloud_monitors import CloudMonitor, AzureMonitor
from operators import Operator, K8SCordonOperator, AzureAllocateOperator


class ScalerBase(object):

    def __init__(self, app_monitor: AppMonitor, infr_monitor: InfrMonitor, cloud_monitor: CloudMonitor,
                 infr_operator: Operator, cloud_operator: Operator, time_interval: int, logger: Logger):
        self._logger = logger
        self._app_monitor = app_monitor
        self._infr_monitor = infr_monitor
        self._cloud_monitor = cloud_monitor
        self._infr_operator = infr_operator
        self._cloud_operator = cloud_operator
        self._cloud_monitor.set_infr_monitor(infr_monitor)
        self._nodes = []
        self._pods = []
        self._vcs = []
        self._time_interval = time_interval

    def _log_node_status(self):
        ts = int(time.time())
        self._logger.info('polling ts = {}, node status:'.format(ts))
        self._logger.info_matrix([
            ['Node Name'] + [node.k8s_name for node in self._nodes],
            ['Is Ready'] + [str(node.k8s_is_ready) for node in self._nodes],
            ['Pod Num'] + [str(node.k8s_pod_num) for node in self._nodes]
        ])

    @abstractmethod
    def _before_scaling(self):
        pass

    def _refresh_information(self):
        self._app_monitor.refresh()
        self._infr_monitor.refresh()
        self._cloud_monitor.refresh()
        self._nodes = self._cloud_monitor.get_nodes()
        self._pods = self._infr_monitor.get_pods()
        self._vcs = self._app_monitor.get_vcs()
        self._log_node_status()

    @abstractmethod
    def _tag_nodes(self):
        raise NotImplementedError

    def _scale(self):
        changed = False
        changed |= self._cloud_operator.scale_up(self._nodes)
        changed |= self._infr_operator.scale_up(self._nodes)
        changed |= self._infr_operator.scale_down(self._nodes)
        changed |= self._cloud_operator.scale_down(self._nodes)
        if changed:
            self._refresh_information()

    @abstractmethod
    def _after_scaling(self):
        pass

    def start(self):
        while True:
            self._before_scaling()
            self._refresh_information()
            self._tag_nodes()
            self._scale()
            self._after_scaling()
            time.sleep(self._time_interval)


class OpenPaiSimpleScaler(ScalerBase):

    def __init__(self, config_path='config.yaml', min_node_num=5, time_interval=300):
        with open(config_path, 'r') as f:
            config = yaml.load(f, yaml.SafeLoader)
        logger = Logger()
        shell = Shell(logger)
        super().__init__(
            app_monitor=OpenPaiMonitor(rest_url=config['pai_rest_server_uri'], token=config['pai_bearer_token']),
            infr_monitor=K8SMonitor(shell=shell),
            cloud_monitor=AzureMonitor(),
            infr_operator=K8SCordonOperator(shell=shell),
            cloud_operator=AzureAllocateOperator(shell=shell, resource_group=config['resource_group']),
            time_interval=time_interval,
            logger=logger
        )
        self._min_node_num = min_node_num

    def _before_scaling(self):
        # TODO: tell openpai / HiveD to keep idle when scaling??
        pass

    def _tag_nodes(self):
        has_pending_pods = any([pod.pending and not self._vcs[pod.vc].is_full for pod in self._pods])
        has_resource_not_guaranteed = any([not vc.is_guaranteed for vc in self._vcs.values()])
        if has_pending_pods or has_resource_not_guaranteed:
            for node in self._nodes:
                node.to_turn_on = True
        else:
            available_node_num = sum([node.k8s_is_ready for node in self._nodes])
            free_nodes = [node for node in self._nodes if node.k8s_is_ready and node.k8s_pod_num == 0]
            for node in free_nodes[:available_node_num - self._min_node_num]:
                node.to_turn_off = True

    def _after_scaling(self):
        pass


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--cluster-config', '-c', help='cluster config file', default='config.yaml')
    args = parser.parse_args()
    OpenPaiSimpleScaler(config_path=args.cluster_config).start()
