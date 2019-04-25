import os
import re
import json
from openpaisdk.utils import update_obj, get_response
from openpaisdk.storage import Storage

def in_job_container(varname: str='PAI_CONTAINER_ID'):
    """
    to check whether it is inside a job container (by checking environmental variables)
        varname (str, optional): Defaults to 'PAI_CONTAINER_ID'. 
    """
    if not os.environ.get(varname, ''):
        return False
    return True


def in_debug_mode(varname: str='DEBUG_MODE'):
    """
    Args:
        varname (str, optional): [description]. Defaults to 'DEBUG_MODE'.
    """
    debug_flag = os.environ.get(varname, False)
    if debug_flag in [True, 1] or isinstance(debug_flag, str) and debug_flag.lower() in ['true', '1', 'yes']:
        return True
    return False


class Job:

    def __init__(self, version: str='1.0', job_dir: str=None, **kwargs):
        self.config = dict()
        self.version = version
        if self.version == '1.0':
            for k in ['jobName', 'image', 'codeDir', 'dataDir', 'outputDir']:
                self.config[k] = ''
            self.config.update(taskRoles=[], jobEnvs={})
        self.config.update(kwargs)
        self.sources, self.job_dir= [], job_dir

    @property
    def minimal_resources(self):
        return dict(taskNumber=1, cpuNumber=4, gpuNumber=0, memoryMB=8192)

    def add_task_role(self, name: str, command: str, **kwargs):
        task_role = dict(name=name, command=command)
        update_obj(task_role, self.minimal_resources)
        update_obj(task_role, kwargs)
        self.config['taskRoles'].append(task_role)
        return self

    @staticmethod
    def simple(jobName: str, image: str, command: str, resources: dict={}, job_envs: dict={}, job_dir: str=None, **kwargs):
        """
        return a job config object from only necessary information
        
        Args:
            jobName (str): [description]
            image (str): [description]
            command (str): [description]
            resources (dict, optional): Defaults to {}. [description]
        
        Returns:
            [type]: [description]
        """
        job = Job(
            jobName=jobName, image=image, job_dir=job_dir, **kwargs
        ).add_task_role(name='main', command=command, **resources)
        job.config['jobEnvs'].update(job_envs)
        return job


class Client:

    def __init__(self, pai_uri: str, user: str=None, passwd: str=None, hdfs_web_uri: str=None):
        self.pai_uri, self.hdfs_web_uri = pai_uri, hdfs_web_uri
        self.user, self.passwd = user, passwd
        self.storages = []
        self.add_storage(hdfs_web_uri=hdfs_web_uri)
    
    @staticmethod
    def from_json(pai_json: str):
        with open(pai_json) as fn:
            cfg = json.load(fn)
        return Client(**cfg)

    @property
    def storage(self):
        return self.storages[0] if len(self.storages) >0 else None
             
    def add_storage(self, hdfs_web_uri: str=None):
        "initialize the connection information"
        if hdfs_web_uri:
            self.storages.append(Storage(protocol='hdfs', url=hdfs_web_uri, user=self.user))
        return self
    
    def get_token(self, expiration=3600):
        """
        [summary]
            expiration (int, optional): Defaults to 3600. [description]
        
        Returns:
            OpenPAIClient: self
        """

        self.token = get_response(
            '{}/rest-server/api/v1/token'.format(self.pai_uri), 
            body={
                'username': self.user, 'password': self.passwd, 'expiration': expiration
            }
        ).json()['token']
        return self

    def submit(self, job: Job, allow_job_in_job: bool=False, append_pai_info: bool=True):
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
        if append_pai_info:
            job.config.setdefault('jobEnvs', {}).update(self.to_envs())
        if job.job_dir:
            job.config['jobEnvs']['PAISDK_JOB_DIR'] = job.job_dir
        if len(job.sources) > 0:
            assert job.job_dir, 'job directory not specified'
            code_dir = '{}/code'.format(job.job_dir)
            job.config['codeDir'] = "$PAI_DEFAULT_FS_URI{}".format(code_dir)
            for file in job.sources:
                self.storage.upload(local_path=file, remote_path='{}/{}'.format(code_dir, file))
        get_response(
            '{}/rest-server/api/v1/user/{}/jobs'.format(self.pai_uri, self.user),
            headers = {
                'Authorization': 'Bearer {}'.format(self.token),
                'Content-Type': 'application/json'
            },
            body = job.config, 
            allowed_status=[202]
        )
        return job.config['jobName']

    def get_job_link(self, job_name: str):
        return '{}/job-detail.html?username={}&jobName={}'.format(self.pai_uri, self.user, job_name)

    def jobs(self, jobName: str=None, name_only: bool=False):
        """
        query the list of jobs
            jobName (str, optional): Defaults to None. [description]
            name_only (bool, optional): Defaults to False. [description]
        
        Returns:
            [type]: [description]
        """

        pth = '{}/rest-server/api/v1/user/{}/jobs'.format(self.pai_uri, self.user)
        if jobName is not None:
            pth += '/' + jobName
        job_list = get_response(
            pth,
            headers = {}, method='GET'
        ).json()
        return [j['name'] for j in job_list] if name_only else job_list


    def to_envs(self):
        """to pass necessary information to job container via environmental variables
        """
        keys = ['user', 'pai_uri', 'hdfs_web_uri']
        dic = {'PAISDK_{}'.format(k.upper()) : getattr(self, k) for k in keys}
        return dic

    @staticmethod
    def from_envs(**kwargs):
        keys = ['user', 'pai_uri', 'hdfs_web_uri']
        dic = {k : os.environ.get('PAISDK_{}'.format(k.upper()), None) for k in keys}
        return Client(**dic)

    