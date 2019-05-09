from openpaisdk.cli_arguments import Namespace, cli_add_arguments
from openpaisdk.io_utils import from_file, to_file
from openpaisdk.utils import merge_two_object
from openpaisdk import __jobs_cache__, __install__, __logger__
import argparse
import os


class JobSpec(Namespace):
    __type__ = 'job-common-spec'
    __fields__ = {
        "requirements": ["prerequisites", []],
    }

    def define(self, parser: argparse.ArgumentParser):
        cli_add_arguments(self, parser, [
            '--job-name',
            '--alias',
            '--workspace',
            '--sources',
            '--image',
            '--disable-sdk-install'
                      ])

    def add_source(self, fname: str):
        if os.path.isfile(fname) and fname not in self.sources:
            self.sources.append(fname)

    def add_to(self, target: str, elem):
        lst = getattr(self, target)
        if elem not in lst:
            lst.append(elem)


class TaskRole(Namespace):
    __type__ = 'task-role-spec'

    def define(self, parser: argparse.ArgumentParser):
        cli_add_arguments(self, parser, [
            '--job-name',
            '--task-role-name',
            '--task-number',
            '--cpu', '--gpu', '--mem',
            'commands'
                      ])


__known_executables__ = ['python', 'python3', 'shell', 'sh', 'bash', 'ksh', 'csh', 'perl']


class Job(JobSpec):
    __type__ = 'job'
    __fields__ = merge_two_object(JobSpec.__fields__, {
        "taskroles": ["taskrole definitions", []]
    })

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        t_objs = [TaskRole(**t) for t in self.taskroles]
        self.taskroles = t_objs

    def store(self):
        self.to_file(Job.job_cache_file(self.job_name))

    @staticmethod
    def job_cache_file(job_name: str):
        return os.path.join(__jobs_cache__, job_name, 'cache.json')

    @staticmethod
    def job_config_file(job_name: str):
        return os.path.join(__jobs_cache__, job_name, 'job_config.json')

    @staticmethod
    def restore(job_name):
        fname = Job.job_cache_file(job_name)
        if os.path.isfile(fname):
            __logger__.debug('restore Job config from %s', fname)
            dic = from_file(fname)
            return Job(**dic)
        return None

    def to_file(self, fname: str):
        to_file(self.to_dict(), fname)

    def to_job_config_v1(self) -> dict:
        for a in ['sources']:
            if getattr(self, a) is None:
                setattr(self, a, [])
        dic = dict(
            jobName=self.job_name,
            image=self.image,
            codeDir='', dataDir='', outputDir='',
            jobEnvs={},
            Prequisites=self.requirements
        )
        dic['taskRoles'] = self.to_job_config_taskroles_v1()
        if self.workspace:
            dic['jobEnvs']['PAI_SDK_JOB_WORKSPACE'] = self.workspace
            dic['jobEnvs']['PAI_SDK_JOB_OUTPUT_DIR'] = self.get_folder_path('output')
            if len(self.sources) >0:
                dic['codeDir'] = "$PAI_DEFAULT_FS_URI{}".format(self.get_folder_path('code'))
        return dic
    
    def to_job_config_taskroles_v1(self):
        commands = []
        if not self.disable_sdk_install:
            commands.append('pip install -U %s' % __install__)
        commands.append('opai runtime execute --working-dir ~/code --config job_config.json')
        taskroles = []
        for t in self.taskroles:
            assert len(t.commands) >0, 'empty commands'
            self.add_source(t.commands[0])
            if t.commands[0] in __known_executables__:
                self.add_source(t.commands[1])
            dic = dict(
                name=t.task_role_name,
                taskNumber=t.task_number,
                cpuNumber=t.cpu, gpuNumber=t.gpu, memoryMB=t.mem,
                userCommands=t.commands
            )
            dic['command'] = ' && '.join(commands)
            taskroles.append(dic)
        return taskroles

    def get_folder_path(self, folder: str='code'):
        return '{}/{}/{}'.format(self.workspace, self.job_name, folder)