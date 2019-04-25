import json
import os.path
import re
import ipykernel
import requests
from subprocess import check_call

from openpaisdk.core import Client, Job

#try:  # Python 3
#    from urllib.parse import urljoin
#except ImportError:  # Python 2
#    from urlparse import urljoin

# Alternative that works for both Python 2 and 3:
from requests.compat import urljoin

try:  # Python 3 (see Edit2 below for why this may not work in Python 2)
    from notebook.notebookapp import list_running_servers
except ImportError:  # Python 2
    import warnings
    from IPython.utils.shimmodule import ShimWarning
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", category=ShimWarning)
        from IPython.html.notebookapp import list_running_servers


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


def convert_to_script(nb_file: str):
    d, fname = os.path.split(nb_file)
    name, ext = os.path.splitext(fname)
    assert ext == '.ipynb', '{} is not ipython notebook'.format(nb_file)
    return name


def submit_notebook(client: Client, job_name: str, image: str, job_dir: str=None, resources: dict={}, job_envs: dict={}, sources: list=[]):
    """
    submit a job with current notebook
    
    Args:
        pai_json (str): [description]
        resources (dict, optional): Defaults to {}. [description]
    """
    # conver to script
    d, fname = os.path.split(get_notebook_path())
    script_name = os.path.splitext(fname)[0] + '.py'
    check_call(['ipython', 'nbconvert', '--to', 'script', fname], cwd=d)
    print('convert {} to script {}'.format(fname, script_name))

    job = Job.simple(
        job_name, image, command='ipython code/{}'.format(script_name), 
        resources=resources, job_envs=job_envs, job_dir=job_dir
    )
    job.sources.extend(sources+[script_name])
    return client.get_token().submit(job)