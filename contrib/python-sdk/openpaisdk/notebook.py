import json
import os.path
import re
import ipykernel
import requests
import uuid

from requests.compat import urljoin
from notebook.notebookapp import list_running_servers


def get_notebook_path():
    """
    Return the full path of the jupyter notebook.
    Reference: https://github.com/jupyter/notebook/issues/1000#issuecomment-359875246
    """
    kernel_id = re.search('kernel-(.*).json',
                          ipykernel.connect.get_connection_file()).group(1)
    servers = list_running_servers()
    for ss in servers:
        response = requests.get(urljoin(ss['url'], 'api/sessions'),
                                params={'token': ss.get('token', '')})
        info =  json.loads(response.text)
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
