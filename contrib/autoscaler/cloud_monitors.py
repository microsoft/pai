from abc import abstractmethod

from utils import Shell
from nodes import WorkerNode
from infr_monitors import InfrMonitor


class CloudMonitor(object):

    def __init__(self):
        self._nodes = []
        self._infr_monitor = None

    @abstractmethod
    def _update_nodes(self):
        raise NotImplementedError

    def set_infr_monitor(self, infr_monitor: InfrMonitor):
        self._infr_monitor = infr_monitor

    def refresh(self):
        self._nodes = self._infr_monitor.get_nodes()
        self._update_nodes()

    def get_nodes(self) -> list:
        return self._nodes


class AzureMonitor(CloudMonitor):

    def __init__(self):
        super().__init__()

    def _update_nodes(self):
        # TODO: + azure information
        pass
