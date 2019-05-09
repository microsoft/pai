import openpaisdk.runtime_requires as req
from openpaisdk.utils import find_match
from openpaisdk.io_utils import from_file
from subprocess import check_call
import os


def runtime_execute(cfg_file: str, wdir: str=''):
    job_config = from_file(os.path.join(wdir, cfg_file))
    t_name = os.environ.get('PAI_CURRENT_TASK_ROLE_NAME', 'main')
    commands = job_config['extras']['userCommands'][t_name]
    return check_call(commands, cwd=wdir if wdir else None)
