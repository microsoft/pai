from openpaisdk.utils import Namespace, attach_args
from openpaisdk.io_utils import from_file, to_file
from openpaisdk import __defaults__, __jobs_cache__, __install__, __logger__
import argparse
import os

class ProtocolUnit (Namespace):

    def __init__(
        self,
        protocolVersion: str='1.0',
        name: str=None, 
        type: str=None,
        version: str=None,
        contributor: str=None,
        description: str=None,
    ): 
        super().__init__()
        attach_args(self)


def define_common_arguments(parser: argparse.ArgumentParser, args: list=[]):
    if 'alias' in args:
        parser.add_argument('--alias', '-a', help='cluster alias to select')
    if 'name' in args:
        parser.add_argument('--name', help='if asserted, show name / alias only; otherwise show all details', action='store_true', default=False)
    if 'job-name' in args:
        parser.add_argument('--job-name', '-j', help='job name', default=__defaults__.get('job-name', None))
    if 'update' in args:
        parser.add_argument('--update', '-u', action='store_true', default=False, help='update current job cache')
    if 'config' in args:
        parser.add_argument('--config', '-c', help='job config file')
    if 'dont-set-as-default' in args:
        parser.add_argument('--dont-set-as-default', action="store_true", default=False, help="dont set current (job) as default")


class JobSpec(Namespace):

    def __init__(self):
        super().__init__()
        self.type = 'job-spec'

    def define(self, parser: argparse.ArgumentParser, common: list=['job-name', 'alias']):
        define_common_arguments(parser, common)
        parser.add_argument('--workspace', '-w', default=__defaults__.get('workspace', None), help='remote path for workspace (store code, output, ...)')
        parser.add_argument('--protocol', default='1.0', help='protocol version')
        parser.add_argument('--sources', '-s', action='append', help='sources files')
        parser.add_argument('--image', '-i', default=__defaults__.get('image', None), help='docker image')
        parser.add_argument('--pip', '-p', action='append', help='pip install packages')
        parser.add_argument('--disable-sdk-install', '-d', action='store_true', default=False, help='disable installing of openpaisdk from github')

    def add_source(self, fname: str):
        if os.path.isfile(fname) and fname not in self.sources:
            self.sources.append(fname)

    def add_to(self, target: str, elem):
        lst = getattr(self, target)
        if elem not in lst:
            lst.append(elem)

class TaskRole(Namespace):
    
    def __init__(self):
        super().__init__()
        self.type = 'task-role'

    def define(self, parser: argparse.ArgumentParser, common: list=['job-name']):
        define_common_arguments(parser, common)
        parser.add_argument('--task-role-name', '-t', default='main', help='task role name')
        parser.add_argument('--task-number', '-n', type=int, default=1, help='number of tasks per role')
        parser.add_argument('--cpu', type=int, default=__defaults__.get('cpu', 1), help='cpu number per instance')
        parser.add_argument('--gpu', type=int, default=__defaults__.get('gpu', 0), help='gpu number per instance')
        parser.add_argument('--mem', type=int, default=__defaults__.get('memMB', 1024), help='memory #MB per instance')
        parser.add_argument('commands', nargs=argparse.REMAINDER, help='shell commands to execute')


__known_executables__ = ['python', 'python3', 'shell', 'sh', 'bash', 'ksh', 'csh', 'perl']


class Job:

    def __init__(self):
        self.spec = JobSpec()
        self.taskroles = []

    def store(self):
        self.to_file(Job.job_cache_file(self.spec.job_name))

    @staticmethod
    def job_cache_file(job_name: str):
        return os.path.join(__jobs_cache__, job_name, 'cache.json')

    def restore(self, job_name):
        fname = Job.job_cache_file(job_name)
        if os.path.isfile(fname):
            __logger__.debug('restore Job config from %s', fname)
            self.from_file(Job.job_cache_file(job_name))
        return self

    def to_dict(self):
        return [vars(elem) for elem in [self.spec] + self.taskroles]

    def to_file(self, fname: str):
        to_file(self.to_dict(), fname)

    def from_file(self, fname):
        lst = from_file(fname, default=[])
        for elem in lst:
            if elem['type'] == 'job-spec':
                self.spec.from_dict(elem)
            elif elem['type'] == 'task-role':
                self.taskroles.append(TaskRole().from_dict(elem))
            else:
                raise NotImplementedError
        return self

    def to_job_config_v1(self) -> dict:
        for a in ['pip', 'sources']:
            if getattr(self.spec, a) is None:
                setattr(self.spec, a, [])
        dic = dict(
            jobName=self.spec.job_name,
            image=self.spec.image,
            codeDir='', dataDir='', outputDir='',
            jobEnvs={}
        )
        dic['taskRoles'] = self.to_job_config_taskroles_v1()
        if self.spec.workspace:
            dic['jobEnvs']['PAI_SDK_JOB_WORKSPACE'] = self.spec.workspace
            dic['jobEnvs']['PAI_SDK_JOB_OUTPUT_DIR'] = self.get_folder_path('output')
            if len(self.spec.sources) >0:
                dic['codeDir'] = "$PAI_DEFAULT_FS_URI{}".format(self.get_folder_path('code'))
        return dic
    
    def to_job_config_taskroles_v1(self):
        if not self.spec.disable_sdk_install:
            self.spec.add_to('pip', __install__)
        pip_commands = ['pip install -U {}'.format(x) for x in self.spec.pip]
        taskroles = []
        for t in self.taskroles:
            assert len(t.commands) >0, 'empty commands'
            self.spec.add_source(t.commands[0])
            if t.commands[0] in __known_executables__:
                self.spec.add_source(t.commands[1])
            dic = dict(
                name=t.task_role_name,
                taskNumber=t.task_number,
                cpuNumber=t.cpu, gpuNumber=t.gpu, memoryMB=t.mem
            )
            dic['command'] = ' && '.join(pip_commands + ['cd code', ' '.join(t.commands)])
            taskroles.append(dic)
        return taskroles

    def get_folder_path(self, folder: str='code'):
        return '{}/{}/{}'.format(self.spec.workspace, self.spec.job_name, folder)