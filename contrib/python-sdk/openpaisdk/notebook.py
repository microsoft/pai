import json
import os.path
import re
from openpaisdk.defaults import LayeredSettings


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


class NotebookConfiguration:
    "wrapper of LayeredSettings"

    @staticmethod
    def reset():
        LayeredSettings.reset()

    @staticmethod
    def print_supported_items():
        LayeredSettings.print_supported_items()

    @staticmethod
    def set(**kwargs):
        for key, value in kwargs.items():
            LayeredSettings.update("user_advaced", key, value)

    @staticmethod
    def get(*args):
        dic = LayeredSettings.as_dict()
        if not args:
            return dic
        elif len(args) == 1:
            return dic[args[0]]
        else:
            return [dic[a] for a in args]
