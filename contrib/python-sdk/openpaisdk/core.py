import json
import os
from copy import deepcopy
from openpaisdk.storage import Storage
from openpaisdk.utils import get_response
from openpaisdk.cli_utils import get_args, cli_add_arguments, Namespace
from openpaisdk.job import Job
from openpaisdk.io_utils import to_file
from openpaisdk import __defaults__, __logger__


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


class Cluster(Namespace):
    __type__ = "cluster-spec"
    __fields__ = dict(
        storage_clients = dict(),
        default_storage_alias = 'default',
    )

    def __init__(self, pai_uri: str=None, user: str=None, passwd: str=None, storages: list=[], **kwargs):
        self.config = get_args()
        __logger__.debug('creating cluster from info %s', self.config)
        super().__init__(**self.config)
        for i, cfg in enumerate(storages):
            self.add_storage(**cfg)
            if i==0:
                self.default_storage_alias = cfg.get('alias')

    def define(self, 
        parser # type: argparse.ArgumentParser
        ):
        cli_add_arguments(self, parser, [
            '--cluster-alias', '--pai-uri', '--user', '--passwd',
        ])

    @property
    def storage(self):
        return self.storage_clients.get(self.default_storage_alias, None)
             
    def add_storage(self, protocol: str=None, storage_lias: str=None, **kwargs):
        "initialize the connection information"
        func = 'add_storage_%s' % protocol.lower()
        return getattr(self, func)(storage_lias, **kwargs)
    
    def add_storage_webhdfs(self, storage_lias, web_hdfs_uri: str, **kwargs):
        self.storage_clients[storage_lias] = Storage(protocol='webHDFS', url=web_hdfs_uri, user=kwargs.get('user', self.user))
        return self

    def get_token(self, expiration=3600):
        """
        [summary]
            expiration (int, optional): Defaults to 3600. [description]
        
        Returns:
            OpenPAIClient: self
        """

        self.token = self.rest_api_token(expiration)
        return self

    def submit(self, job: Job, job_config: dict=None, allow_job_in_job: bool=False, append_pai_info: bool=True):
        """
        [summary]
        
        Args:
            job (Job): job config
            allow_job_in_job (bool, optional): Defaults to False. [description]
        
        Returns:
            [str]: job name
        """

        if not allow_job_in_job:
            assert not in_job_container(), 'not allowed submiting jobs inside a job'
        if not job_config:
            job_config = job.to_job_config_v1(save_to_file=None)

        if append_pai_info:
            job_config['extras']['__clusters__'] = [Cluster.desensitize(self.config)]
            job_config['extras']['__defaults__'] = __defaults__
        code_dir = job.get_workspace_folder('code')
        files_to_upload = job.sources if job.sources else []
        for file in files_to_upload:
            self.storage.upload(local_path=file, remote_path='{}/{}'.format(code_dir, file), overwrite=True)
        c_file = job.get_config_file()
        if os.path.isfile(c_file):
            to_file(job_config, c_file)
            self.storage.upload(local_path=c_file, remote_path='{}/{}'.format(code_dir, os.path.basename(c_file)), overwrite=True)

        self.get_token().rest_api_submit(job_config)
        return job_config['jobName']

    def get_job_link(self, job_name: str):
        return '{}/job-detail.html?username={}&jobName={}'.format(self.pai_uri, self.user, job_name)

    def jobs(self, job_name: str=None, name_only: bool=False):
        """
        query the list of jobs
            jobName (str, optional): Defaults to None. [description]
            name_only (bool, optional): Defaults to False. [description]
        
        Returns:
            [type]: [description]
        """

        job_list = self.rest_api_jobs(job_name)
        return [j['name'] for j in job_list] if name_only else job_list

    def rest_api_jobs(self, job_name: str=None, info: str=None):
        pth = '{}/rest-server/api/v1/user/{}/jobs'.format(self.pai_uri, self.user)
        if job_name:
            pth = pth + '/' + job_name
            if info:
                assert info in ['config', 'ssh'], ('unsupported query information', info)
                pth = pth + '/' + info
        return get_response(pth, headers = {}, method='GET').json()

    def rest_api_token(self, expiration=3600):
        return get_response(
            '{}/rest-server/api/v1/token'.format(self.pai_uri), 
            body={
                'username': self.user, 'password': self.config['passwd'], 'expiration': expiration
            }
        ).json()['token']

    def rest_api_submit(self, job_config: dict):
        return get_response(
            '{}/rest-server/api/v1/user/{}/jobs'.format(self.pai_uri, self.user),
            headers = {
                'Authorization': 'Bearer {}'.format(self.token),
                'Content-Type': 'application/json'
            },
            body = job_config, 
            allowed_status=[202, 201]
        )

    @staticmethod
    def desensitize(cluster_cfg: dict):
        dic = deepcopy(cluster_cfg)
        dic['passwd'] = "******"
        return dic