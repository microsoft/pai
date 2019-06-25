from openpaisdk.cluster import ClusterList, Cluster, ClusterClient
from openpaisdk.job import Job
from openpaisdk.io_utils import get_defaults
from uuid import uuid4 as randstr
import os
import json
import yaml


def pprint(s, fmt: str='yaml', **kwargs):
    """the function to output structured strings as cli feedback"""
    if fmt == 'json':
        print(json.dumps(s, indent=4, **kwargs))
    if fmt == 'yaml':
        print(yaml.dump(s, default_flow_style=False))


def in_job_container(varname: str='PAI_CONTAINER_ID'):
    """in_job_container check whether it is inside a job container (by checking environmental variables)


    Keyword Arguments:
        varname {str} -- the variable to test (default: {'PAI_CONTAINER_ID'})

    Returns:
        [bool] -- return True is os.environ[varname] is set
    """
    if not os.environ.get(varname, ''):
        return False
    return True


def submit_notebook(
    job: Job, cluster_alis: str, nb_file: str, image: str, workspace: str, # cluster related
    interactive_mode: bool=True, token: str="abcd", # notebook only
    gpu: int=0, cpu: int=1, memoryMB: int=10240, ports: dict={}, # resources related
    **kwargs
    ):
    job_name = os.path.splitext(os.path.basename(nb_file))[0] + "_" + randstr().hex
    job.from_notebook(nb_file, image, interactive_mode, token, gpu=gpu, cpu=cpu, memoryMB=memoryMB, ports=ports)
    job.decorate(cluster_alis, workspace)
    return job