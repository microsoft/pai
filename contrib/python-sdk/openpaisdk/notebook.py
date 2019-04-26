import json
import os.path
import re
import ipykernel
import requests
import uuid
from subprocess import check_call

from openpaisdk.core import Client, Job

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
    image: str, 
    job_dir: str=None,
    nb_file: str=None,
    client: Client=None,
    alias: str=None, 
    job_name: str=None, 
    resources: dict={}, 
    sources: list=[],
    pip_requirements: list=[],
    ):
    """submit_notebook submit current notebook to openpai
    
    Arguments:
        image {str} -- docker image
    
    Keyword Arguments:
        job_dir {str} -- remote storage path to upload code, if None, use user/$USER/jobs/$JOB_NAME (default: {None})
        nb_file {str} -- notebook path, if None, use current notebook (default: {None})
        client {Client} -- OpenPAI client, if None, use Client.from_json('openpai.json', alias) (default: {None})
        alias {str} -- client alias (default: {None})
        job_name {str} -- job name, if None, use notebook name plus random string (default: {None})
        resources {dict} -- resource requirements (default: {{}})
        sources {list} -- source files to be uploaded (default: {[]})
        pip_requirements {list} -- pip install commands to execute first
    
    Returns:
        [str] -- job name
    """
    if nb_file is None:
        nb_file = get_notebook_path()
    d, fname = os.path.split(nb_file)
    name = os.path.splitext(fname)[0]
    if client is None:
        client = Client.from_json('openpai.json', alias)
    if job_name is None:
        job_name = name + '_' + uuid.uuid4().hex
    if job_dir is None:
        job_dir = '/user/{}/jobs/{}'.format(client.user, job_name)
    # conver to script
    script_name = name + '.py'
    check_call(['ipython', 'nbconvert', '--to', 'script', fname], cwd=d)

    job = Job.simple(
        job_name, image, command='ipython code/{}'.format(script_name), 
        resources=resources, job_dir=job_dir,
        pip_requirements=pip_requirements, sources=sources+[script_name]
    )
    client.get_token().submit(job)
    return client.get_job_link(job_name)