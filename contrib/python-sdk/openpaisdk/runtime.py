import openpaisdk.runtime_requires as req
from openpaisdk.io_utils import from_file
from subprocess import check_call
import os


def runtime_execute(cfg_file: str, wdir: str=''):
    job_config = from_file(os.path.join(wdir, cfg_file))
    dic = {t['name']: t for t in job_config['taskRoles']}
    current_task_role = dic[os.environ.get('PAI_CURRENT_TASK_ROLE_NAME', 'main')]
    return check_call(current_task_role['userCommands'], cwd=wdir if wdir else None)
