import json
import os.path
import re

from openpaisdk.defaults import __predefined_defaults__, CfgDict, read_defaults
from openpaisdk.io_utils import to_screen


def get_notebook_path():
    """
    Return the full path of the jupyter notebook.
    Reference: https://github.com/jupyter/notebook/issues/1000#issuecomment-359875246
    """
    import requests
    from requests.compat import urljoin
    from notebook.notebookapp import list_running_servers
    import ipykernel

    kernel_id = re.search('kernel-(.*).json',
                          ipykernel.connect.get_connection_file()).group(1)
    servers = list_running_servers()
    for ss in servers:
        response = requests.get(urljoin(ss['url'], 'api/sessions'),
                                params={'token': ss.get('token', '')})
        info = json.loads(response.text)
        if isinstance(info, dict) and info['message'] == 'Forbidden':
            continue
        for nn in info:
            if nn['kernel']['id'] == kernel_id:
                relative_path = nn['notebook']['path']
                return os.path.join(ss['notebook_dir'], relative_path)


def parse_notebook_path():
    "parse the running notebook path to name, folder, extension"
    nb_file = get_notebook_path()
    folder, fname = os.path.split(nb_file)
    name, ext = os.path.splitext(fname)
    return name, folder, ext


# remove cluster-alias, virtual-cluster
class NotebookConfiguration(CfgDict):

    def __init__(self, **kwargs):
        super().__init__(
            __predefined_defaults__[2:],
            load_default=False
        )
        self._sdk_defaults = {
            k: v for k, v in read_defaults().items() if k not in ["cluster-alias", "virtual-cluster"]
        }
        self.update(kwargs)

    @staticmethod
    def print_supported_items():
        CfgDict(__predefined_defaults__[2:]).print()

    def __getitem__(self, key):
        "priority: value set > _sdk_defaults > _predefined_dict > None"
        return dict.get(
            self, key, self._sdk_defaults.get(
                key, self._predefined_dict.get(
                    key, None
                )
            )
        )
