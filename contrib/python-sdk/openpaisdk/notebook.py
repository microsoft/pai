import json
import os.path
import re
import ipykernel
import requests
import uuid

from openpaisdk.command_line import Engine
from openpaisdk.utils import run_command

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
        for nn in json.loads(response.text):
            if nn['kernel']['id'] == kernel_id:
                relative_path = nn['notebook']['path']
                return os.path.join(ss['notebook_dir'], relative_path)


def parse_notebook_path():
    nb_file = get_notebook_path()
    d, fname = os.path.split(nb_file)
    name, ext = os.path.splitext(fname)
    return d, name, ext


def submit_notebook(
    nb_file=None, # type: str
    job_name=None, # type: str
    extra_args=[] # type: list
    ):
    """submit_notebook submit current notebook to openpai
    
    Arguments:
        image {str} -- docker image
    
    Keyword Arguments:
        job_dir {str} -- remote storage path to upload code, if None, use user/$USER/jobs/$JOB_NAME (default: {None})
        nb_file {str} -- notebook path, if None, use current notebook (default: {None})
        client {Cluster} -- OpenPAI client, if None, use Cluster.from_json('openpai.json', alias) (default: {None})
        alias {str} -- client alias (default: {None})
        job_name {str} -- job name, if None, use notebook name plus random string (default: {None})
        resources {dict} -- resource requirements (default: {{}})
        sources {list} -- source files to be uploaded (default: {[]})
        pip_requirements {list} -- pip install commands to execute first
    
    Returns:
        [str] -- job name
    """
    commands = ['job', 'fast']
    if nb_file is None:
        nb_file = get_notebook_path()
    d, fname = os.path.split(nb_file)
    name = os.path.splitext(fname)[0]
    if job_name is None:
        job_name = name + '_' + uuid.uuid4().hex
    commands.extend(['-j', job_name])

    commands.extend(extra_args)

    # conver to script
    script_name = name + '.py'
    run_command(['ipython', 'nbconvert', '--to', 'script', fname], cwd=d)
    commands.extend(['-s', script_name])
    commands.extend(['ipython', script_name])

    return Engine().process(commands)
