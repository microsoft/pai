import openpaisdk.runtime_requires as req
from openpaisdk.io_utils import safe_chdir
from openpaisdk.io_utils import from_file, to_file
from openpaisdk import __logger__, __cluster_config_file__, __local_default_file__
from subprocess import check_call
import os


def runtime_deployment(job_config: dict, wdir: str=''):
    t_name = os.environ.get('PAI_CURRENT_TASK_ROLE_NAME', 'main')
    req_dic = {getattr(req, r).__type__: getattr(req, r) for r in dir(req) if r.endswith('Requirement')}
    for r in job_config['extras']['prequisites']:
        if r['task_role_name'] in [None, t_name]:
            a = req_dic[r['type']](**r)  # type: req.Requirement
            a.process()


def runtime_restore_config(job_config):
    if not os.path.isfile(__cluster_config_file__):
        to_file(job_config.get('extras', {}).get('__clusters__', []), __cluster_config_file__)
    if not os.path.isfile(__local_default_file__):
        to_file(job_config.get('extras', {}).get('__defaults__', {}), __local_default_file__)
        __logger__.info("Restore defaults to %s", __local_default_file__)


def runtime_execute(cfg_file: str, wdir: str=''):
    job_config = from_file(os.path.join(wdir, cfg_file))
    with safe_chdir(wdir) as d:
        runtime_restore_config(job_config)
        runtime_deployment(job_config, d)
        t_name = os.environ.get('PAI_CURRENT_TASK_ROLE_NAME', 'main')
        commands = job_config['extras']['userCommands'][t_name]
        return check_call(commands)
