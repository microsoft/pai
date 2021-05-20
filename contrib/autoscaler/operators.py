from abc import abstractmethod

from utils import Shell
from nodes import WorkerNode


class Operator(object):

    def __init__(self, shell: Shell):
        self._shell = shell

    @abstractmethod
    def _turn_on(self, nodes: list):
        raise NotImplementedError

    @abstractmethod
    def _turn_off(self, nodes: list):
        raise NotImplementedError

    def scale_up(self, nodes: list) -> bool:
        nodes_to_turn_on = [node for node in nodes if node.to_turn_on]
        if nodes_to_turn_on:
            self._turn_on(nodes_to_turn_on)
            return True
        return False

    def scale_down(self, nodes: list) -> bool:
        nodes_to_turn_off = [node for node in nodes if node.to_turn_off]
        if nodes_to_turn_off:
            self._turn_off(nodes_to_turn_off)
            return True
        return False


class K8SCordonOperator(Operator):

    def _turn_on(self, nodes: list):
        self._shell.execute('kubectl uncordon {}'.format(
            ' '.join([node.k8s_name for node in nodes])
        ))

    def _turn_off(self, nodes: list):
        self._shell.execute('kubectl cordon {}'.format(
            ' '.join([node.k8s_name for node in nodes])
        ))


class AzureAllocateOperator(Operator):

    def _turn_on(self, nodes: list):
        self._shell.execute('az vmss start --no-wait --name pai-worker --resource-group pai-worker_group --instance-ids {}'.format(
            ' '.join([node.k8s_name for node in nodes])
        ))

    def _turn_off(self, nodes: list):
        self._shell.execute('az vmss deallocate --no-wait --name pai-worker --resource-group pai-worker_group --instance-ids {}'.format(
            ' '.join([node.k8s_name for node in nodes])
        ))
