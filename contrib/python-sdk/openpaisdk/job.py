from openpaisdk.cli_arguments import Namespace, cli_add_arguments, not_not
from openpaisdk.io_utils import from_file, to_file
from openpaisdk.utils import merge_two_object, psel
from openpaisdk.utils import OrganizedList as ol
from openpaisdk import __jobs_cache__, __install__, __logger__, __cluster_config_file__, __defaults__, __sdk_branch__
from openpaisdk import get_client_cfg
import argparse
import os


class JobSpec(Namespace):
    __type__ = 'job-common-spec'
    __fields__ = {
        "requirements": [], # prerequisites
    }

    def define(self, parser: argparse.ArgumentParser):
        super().define(parser)
        cli_add_arguments(self, parser, [
            '--job-name',
            '--cluster-alias',
            '--storage-alias', # use which storage for code transfer
            '--workspace',
            '--code-dir',
            '--sources',
            '--image',
            '--disable-sdk-install'
        ])

    def validate(self):
        not_not(self, [
            '--job-name',
            '--cluster-alias',
            '--workspace',
            '--image',
        ])
        for a in ['sources']:
            if getattr(self, a) is None:
                setattr(self, a, [])


    def add_source(self, fname: str):
        if fname not in self.sources:
            self.sources.append(fname)

    def add_to(self, target: str, elem):
        lst = getattr(self, target)
        if elem not in lst:
            lst.append(elem)


class TaskRole(Namespace):
    __type__ = 'task-role-spec'

    def define(self, parser: argparse.ArgumentParser):
        super().define(parser)
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
        "taskroles": [] # taskrole definitions
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

    def to_job_config_v1(self, save_to_file: str=None, cluster_info: dict=None) -> dict:
        dic = dict(
            jobName=self.job_name,
            image=self.image,
            codeDir='', dataDir='', outputDir='',
            jobEnvs={},
            extras=dict(prequisites=self.requirements),
        )
        dic["extras"]["__signature__"] = "python-sdk@%s" % __sdk_branch__

        dic['taskRoles'] = self.to_job_config_taskroles_v1()
        dic['extras']['userCommands'] = {t.task_role_name: t.commands for t in self.taskroles}

        # Sources
        dic['jobEnvs']['PAI_SDK_JOB_WORKSPACE'] = self.workspace
        dic['jobEnvs']['PAI_SDK_JOB_OUTPUT_DIR'] = self.get_workspace_folder('output')
        dic['jobEnvs']['PAI_SDK_JOB_CODE_DIR'] = self.code_dir if self.code_dir else self.get_workspace_folder('code')
        if self.workspace:
            dic['codeDir'] = "$PAI_DEFAULT_FS_URI{}".format(self.get_workspace_folder('code'))
            dic['outputDir'] = "$PAI_DEFAULT_FS_URI{}".format(self.get_workspace_folder('output'))

        dic['extras']['__clusters__'] = ol.filter(get_client_cfg(None)["all"], "cluster_alias", self.cluster_alias)["matches"]
        dic['extras']['__defaults__'] = __defaults__
        dic['extras']['__sources__'] = self.sources

        if save_to_file:
            to_file(dic, save_to_file)
        return dic

    def to_job_config_taskroles_v1(self):
        commands = []
        if not self.disable_sdk_install:
            commands.append('pip install -U %s' % __install__)
        commands.append('opai runtime execute --working-dir . code/job_config.json')
        taskroles = []
        for t in self.taskroles:
            assert len(t.commands) >0, 'empty commands'
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
        if not self.workspace:
            return None
        return '{}/jobs/{}/{}'.format(self.workspace, self.job_name, folder)

    @staticmethod
    def job_cache_file(job_name: str, fname: str = 'cache.json'):
        return os.path.join(__jobs_cache__, job_name, fname)

    @staticmethod
    def get_config_file(args):
        fname = 'job_config.yaml' if getattr(args, 'v2', False) else 'job_config.json'
        return os.path.join(__jobs_cache__, args.job_name, fname)

    def get_cache_file(self):
        return Job.job_cache_file(self.job_name)