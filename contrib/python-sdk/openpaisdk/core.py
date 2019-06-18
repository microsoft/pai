import json
import os
from copy import deepcopy
from openpaisdk.storage import Storage
from openpaisdk.utils import get_response
from openpaisdk.cli_arguments import get_args, cli_add_arguments, Namespace
from openpaisdk.job import Job
from openpaisdk.io_utils import to_file, from_file
from openpaisdk import __defaults__, __logger__, __cluster_config_file__
from openpaisdk.utils import OrganizedList as ol


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


class Cluster:

    @staticmethod
    def new(c_dic: dict):
        dic = {
            "storages": [],
            "default_storage_alias": None,
        }
        dic.update(c_dic)
        return dic

    @staticmethod
    def attach_storage(c_dic: dict, storage: dict):
        if "user" in storage and not storage["user"]:
            storage["user"] = c_dic["user"]
        return ol.notified_add(c_dic["storages"], "storage_alias", storage)

    @staticmethod
    def validate(cluster: dict):
        assert cluster["pai_uri"].startswith("http://") or cluster["pai_uri"].startswith("https://"), "pai_uri should be a uri starting with http(s)://"
        assert cluster["user"], "cluster should have a cluster"
        assert isinstance(cluster["storages"], list), "storages should be list"
        return cluster


class ClusterList:

    def __init__(self):
        self.clusters = []

    def load(self):
        self.clusters = from_file(__cluster_config_file__, default=[])
        assert isinstance(self.clusters, list), "contents in %s should be a list" % __cluster_config_file__

    def save(self):
        to_file(self.clusters, __cluster_config_file__)

    def tell(self):
        lst = deepcopy(self.clusters)
        for dic in lst:
            dic["password"] = "******"
        return lst

    def add(self, cluster: dict):
        return ol.notified_add(self.clusters, "cluster_alias", Cluster.validate(Cluster.new(cluster)))

    def delete(self, alias: str):
        ol.delete(self.clusters, "cluster_alias", alias)

    def select(self, alias: str=None):
        if not alias and len(self.clusters) == 1:
            alias = list(self.clusters.values())[0]["cluster_alias"]
        assert alias, "must specify a cluster_alias"
        return ol.as_dict(self.clusters, "cluster_alias")[alias]

    def attach_storage(self, alias: str, storage: dict, as_default: bool=False):
        cluster = self.select(alias)
        result = Cluster.attach_storage(cluster, storage)
        if as_default:
            cluster["default_storage_alias"] = storage["storage_alias"]
        return result

    def get_client(self, alias: str):
        return ClusterClient(**self.select(alias))

    def submit(self, alias: str, job: Job):
        job.validate()
        client = self.get_client(alias)
        client.get_token().rest_api_submit(job.get_config())
        return client.get_job_link(job.name)

class ClusterClient:

    def __init__(self, pai_uri: str=None, user: str=None, password: str=None, storages: list=[], default_storage_alias: str=None, **kwargs):
        __logger__.debug('creating cluster from info %s', get_args())
        self.pai_uri = pai_uri
        self.user = user
        self.password = password
        self.storages = storages
        self.default_storage_alias = default_storage_alias
        self.storage_clients = {}
        for k, v in kwargs.items():
            setattr(self, k, v)
        for cfg in storages:
            self.add_storage(**cfg)
        if len(storages) == 1:
            self.default_storage_alias = storages[0]["storage_alias"]

    def get_storage(self, alias: str=None):
        if len(self.storage_clients) == 0:
            return None
        return self.storage_clients[alias if alias else self.default_storage_alias]

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
                'username': self.user, 'password': self.password, 'expiration': expiration
            }
        ).json()['token']

    def rest_api_submit(self, job: dict):
        use_v2 = str(job.get("protocolVersion", 1)) == "2"
        if use_v2:
            return get_response(
                '{}/rest-server/api/v2/jobs'.format(self.pai_uri),
                headers = {
                    'Authorization': 'Bearer {}'.format(self.token),
                    'Content-Type': 'text/yaml',
                },
                body = job,
                allowed_status=[202, 201]
            )
        else:
            return get_response(
                '{}/rest-server/api/v1/user/{}/jobs'.format(self.pai_uri, self.user),
                headers = {
                    'Authorization': 'Bearer {}'.format(self.token),
                    'Content-Type': 'application/json',
                },
                body = job,
                allowed_status=[202, 201]
            )
