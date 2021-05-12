import time
import argparse

from utils import Logger, Shell
from nodes import WorkerNodeDict
from agents import K8SAgent, AzureAgent, OpenPaiAgent


class OpenPaiScaler:

    def __init__(self, config=None, time_interval=300, min_machine_num=5):
        self._logger = Logger()
        self._pai = OpenPaiAgent(
            rest_uri='https://int.openpai.org/rest-server',
            token='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Imd1c3VpIiwiYXBwbGljYXRpb24iOnRydWUsImlhdCI6MTYxMzc4OTYwNn0.-5pLDNKCbXSdwxXdDmlEkhVTVEmbjUtU_7ny2j4I-no'
        )
        self._logger.info(self._pai._get_vc())
        shell = Shell(self._logger)
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
        elif x == 'should_be_started_nodes':
            result = self._nodes.get_should_be_started_nodes()
        elif x == 'if_resource_not_guaranteed':
            result = self._pai.get_if_resource_not_guaranteed()
        elif x == 'fully_used_vc_set':
            result = self._pai.get_fully_used_vc_set()
        elif x == 'if_valid_waiting_pod_exists':
            result = self._k8s.get_if_valid_waiting_pod_exists(self._pai.get_fully_used_vc_set())
        else:
            result = None

        ts = int(time.time())
        try:
            self._logger.info('polling ts = {}, {} = {}, count = {}'.format(ts, x, result, len(result)))
        except Exception:
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
            self._k8s.start_instance_no_wait(self._get('should_be_started_nodes'))
        else:
            should_be_deallocated_nodes = self._get('free_nodes')[:len(self._get('available_nodes')) - self._min_machine_num]
            if should_be_deallocated_nodes:
                self._k8s.deallocate_instance_no_wait(should_be_deallocated_nodes)
    
    def start(self):
        while True:
            self._before_scaling()
            self._scale()
            self._after_scaling()
            time.sleep(self._time_interval)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("--cluster-config", "-c", help="cluster config file", default="config.json")
    args = parser.parse_args()

    # logger = LOGGER()
    # logger.info("load cluster config from {}".format(args.cluster_config))
    # with open(args.cluster_config) as fn:
    #     config = json.load(fn)
    # pai_client = OpenPaiAgent(config["rest-server"], config["token"])
    # print(pai_agent.get_vc())
    OpenPaiScaler().start()
