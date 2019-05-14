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
            '--cluster-alias',
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
        if self.job_name:
            self.to_file(Job.job_cache_file(self.job_name))

    @staticmethod
    def restore(job_name):
        fname = Job.job_cache_file(job_name)
        if os.path.isfile(fname):
            __logger__.debug('restore Job config from %s', fname)
            dic = from_file(fname)
            return Job(**dic)
        return Job()

    def to_file(self, fname: str):
        to_file(self.to_dict(), fname)

    def to_job_config_v1(self, save_to_file: str=None) -> dict:
        for a in ['sources']:
            if getattr(self, a) is None:
                setattr(self, a, [])
        dic = dict(
            jobName=self.job_name,
            image=self.image,
            codeDir='', dataDir='', outputDir='',
            jobEnvs={},
            extras=dict(prequisites=self.requirements),
        )
        dic['taskRoles'] = self.to_job_config_taskroles_v1()
        dic['extras']['userCommands'] = {t.task_role_name: t.commands for t in self.taskroles}
        if self.workspace:
            dic['jobEnvs']['PAI_SDK_JOB_WORKSPACE'] = self.workspace
            dic['jobEnvs']['PAI_SDK_JOB_OUTPUT_DIR'] = self.get_workspace_folder('output')
            dic['codeDir'] = "$PAI_DEFAULT_FS_URI{}".format(self.get_workspace_folder('code'))
        if save_to_file:
            to_file(dic, save_to_file)
        return dic
    
    def to_job_config_taskroles_v1(self):
        commands = []
        if not self.disable_sdk_install:
            commands.append('pip install -U %s' % __install__)
        commands.append('opai runtime execute --working-dir code job_config.json')
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
            )
            dic['command'] = ' && '.join(commands)
            taskroles.append(dic)
        return taskroles

    # storage based job management

    def get_workspace_folder(self, folder: str= 'code'):
        return '{}/jobs/{}/{}'.format(self.workspace, self.job_name, folder)

    @staticmethod
    def job_cache_file(job_name: str, fname: str = 'cache.json'):
        return os.path.join(__jobs_cache__, job_name, fname)

    def get_config_file(self):
        return Job.job_cache_file(self.job_name, 'job_config.json')

    def get_cache_file(self):
        return Job.job_cache_file(self.job_name)