import requests
from abc import abstractmethod

from nodes import VirtualCluster


class AppMonitor(object):

    def __init__(self):
        self._virtual_clusters = []
    
    @abstractmethod
    def _update_vc(self):
        raise NotImplementedError

    def refresh(self):
        self._update_vc()

    def get_vcs(self) -> dict:
        return self._virtual_clusters


class OpenPaiMonitor(AppMonitor):

    def __init__(self, rest_url: str, token: str) -> None:
        super().__init__()
        self._rest_url = rest_url
        self._token = token

    def _update_vc(self):
        r = requests.get(
            '{}/api/v2/virtual-clusters'.format(self._rest_url),
            headers={
                'Authorization': 'Bearer {}'.format(self._token)
            },
        )
        r.raise_for_status()
        self._virtual_clusters = {name: VirtualCluster(
            name = name,
            is_full = status['resourcesUsed']['GPUs'] == status['resourcesTotal']['GPUs'],
            is_guaranteed = status['resourcesGuaranteed']['GPUs'] == status['resourcesTotal']['GPUs']
        ) for name, status in r.json().items()}
