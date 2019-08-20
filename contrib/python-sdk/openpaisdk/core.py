from openpaisdk.cluster import ClusterList, Cluster
from openpaisdk.job import Job
from uuid import uuid4 as randstr
import os
import json
import yaml


def pprint(s, fmt: str = 'yaml', **kwargs):
    """the function to output structured strings as cli feedback"""
    if fmt == 'json':
        print(json.dumps(s, indent=4, **kwargs))
    if fmt == 'yaml':
        print(yaml.dump(s, default_flow_style=False))


def in_job_container(varname: str = 'PAI_CONTAINER_ID'):
    """in_job_container check whether it is inside a job container (by checking environmental variables)


    Keyword Arguments:
        varname {str} -- the variable to test (default: {'PAI_CONTAINER_ID'})

    Returns:
        [bool] -- return True is os.environ[varname] is set
    """
    if not os.environ.get(varname, ''):
        return False
    return True
