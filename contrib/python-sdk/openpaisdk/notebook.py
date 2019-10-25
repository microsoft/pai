# Copyright (c) Microsoft Corporation
# All rights reserved.
#
# MIT License
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
# documentation files (the "Software"), to deal in the Software without restriction, including without limitation
# the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
# to permit persons to whom the Software is furnished to do so, subject to the following conditions:
# The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
# BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
# DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


import json
import os.path
import re
from openpaisdk.defaults import LayeredSettings, __flags__


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
        ret = LayeredSettings.print_supported_items()
        if __flags__.disable_to_screen:
            print(ret)

    @staticmethod
    def set(key, value):
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
