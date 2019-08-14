import os
import re
import time
from copy import deepcopy

from openpaisdk import __cluster_config_file__, __logger__
from openpaisdk.cli_arguments import get_args
from openpaisdk.io_utils import from_file, to_file, to_screen
from openpaisdk.storage import Storage
from openpaisdk.utils import OrganizedList as ol
from openpaisdk.utils import get_response, na


def get_cluster(alias: str, fname: str = __cluster_config_file__, get_client: bool = True):
    """the generalized function call to load cluster
    return cluster client if assert get_client else return config"""
    if get_client:
        return ClusterList().load(fname).get_client(alias)
    else:
        return ClusterList().load(fname).select(alias)


class ClusterList:
    """Data structure corresponding to the contents of ~/.openpai/clusters.yaml
    We use an OrganizedList to handle the operations to this class
    """

    def __init__(self, clusters: list = None):
        self.clusters = clusters if clusters else []

    def load(self, fname: str = __cluster_config_file__):
        self.clusters = from_file(fname, default=[])
        return self

    def save(self):
        to_file(self.clusters, __cluster_config_file__)

    def tell(self):
        """return the content of clusters, but hide the password"""
        lst = deepcopy(self.clusters)
        for dic in lst:
            dic["password"] = "******"
            dic["token"] = "******"
        return lst

    def add(self, cluster: dict):
        cfg = Cluster().load(**cluster).check().config
        ol.add(self.clusters, "cluster_alias", cfg)
        return self

    def delete(self, alias: str):
        ol.delete(self.clusters, "cluster_alias", alias)
        return self

    def select(self, alias: str = None):
        """return the cluster configuration (dict) with its alias equal to specified one
        if only one cluster in the list and alias is not set, the only cluster would be returned"""
        if not alias and len(self.clusters) == 1:
            alias = self.clusters[0]["cluster_alias"]
            __logger__.warn(
                "cluster-alias is not set, the only defined cluster %s will be used", alias)
        assert alias, "must specify a cluster_alias"
        dic = ol.as_dict(self.clusters, "cluster_alias")
        if alias not in dic:
            os.system("cat %s" % __cluster_config_file__)
            __logger__.error("cannot find %s from %s (%s)",
                             alias, list(dic.keys()), __cluster_config_file__)
        return dic[alias]

    def get_client(self, alias: str):
        return Cluster(**self.select(alias))

    def available_resources(self):
        dic = {}
        for cluster in self.clusters:
            try:
                a = cluster["cluster_alias"]
                dic[a] = self.get_client(a).available_resources()
            except Exception as identifier:
                __logger__.exception(identifier)
        return dic


class Cluster:
    """A wrapper of cluster to access the REST APIs"""

    def __init__(self, toke_expiration: int = 3600):
        # ! currently sdk will not handle toke refreshing
        self.config = {}
        self.__token_expire = toke_expiration
        self.__token = None

    def load(self, cluster_alias: str = None, pai_uri: str = None, user: str = None, password: str = None, token: str = None, **kwargs):
        self.config.update(get_args())
        # validate
        assert self.alias, "cluster must have an alias"
        assert self.user, "must specify a user name"
        assert re.match("^(http|https)://(.*[^/])$",
                        self.pai_uri), "pai_uri should be a uri in the format of http(s)://x.x.x.x"
        return self

    @property
    def alias(self):
        return self.config["cluster_alias"]

    @property
    def pai_uri(self):
        return self.config["pai_uri"].strip("/")

    @property
    def user(self):
        return self.config["user"]

    @property
    def password(self):
        return str(self.config["password"])

    @property
    def token(self):
        if self.config["token"]:
            return str(self.config["token"])
        if not self.__token:
            self.__token = self.rest_api_token(self.__token_expire)
        return self.__token

    def check(self):
        cluster_info = self.rest_api_cluster_info()
        self.config.update(cluster_info)
        #! will check authentication types according to AAD enabled or not
        self.config["virtual_clusters"] = self.virtual_clusters()
        to_screen("succeeded to connect cluster {}".format(self.alias))
        return self

    def get_storage(self, alias: str = None):
        if len(self.storage_clients) == 0:
            return None
        return self.storage_clients[alias if alias else self.default_storage_alias]

    def add_storage(self, protocol: str = None, storage_alias: str = None, **kwargs):
        "initialize the connection information"
        func = 'add_storage_%s' % protocol.lower()
        return getattr(self, func)(storage_alias, **kwargs)

    def add_storage_webhdfs(self, storage_alias, web_hdfs_uri: str, **kwargs):
        self.storage_clients[storage_alias] = Storage(
            protocol='webHDFS', url=web_hdfs_uri, user=kwargs.get('user', self.user))
        return self

    def get_job_link(self, job_name: str):
        return '{}/job-detail.html?username={}&jobName={}'.format(self.pai_uri, self.user, job_name)

    def jobs(self, job_name: str = None, name_only: bool = False):
        """
        query the list of jobs
            jobName (str, optional): Defaults to None. [description]
            name_only (bool, optional): Defaults to False. [description]

        Returns:
            [type]: [description]
        """

        job_list = self.rest_api_jobs(job_name)
        return [j['name'] for j in job_list] if name_only else job_list

    def rest_api_cluster_info(self):
        # ! currently this is a fake
        return {
            "pylon_enabled": True,
            "aad_enabled": False,
            "storages": {
                "builtin": {
                    "protocol": "hdfs",
                    "ports": {
                        "webhdfs": "webhdfs",
                        "native": 9000,
                    }
                }
            }
        }

    def rest_api_job_list(self, user: str = None):
        if user is None:
            pth = '{}/rest-server/api/v1/jobs'.format(self.pai_uri)
        else:
            pth = '{}/rest-server/api/v1/user/{}/jobs'.format(
                self.pai_uri, user)
        return get_response(pth, headers={}, method='GET').json()

    def rest_api_job_info(self, job_name: str = None, info: str = None, user: str = None):
        user = self.user if user is None else user
        assert job_name, "please specify a job to query"
        pth = '{}/rest-server/api/v1/user/{}/jobs/{}'.format(
            self.pai_uri, user, job_name)
        if info:
            assert info in [
                'config', 'ssh'], ('unsupported query information', info)
            pth = pth + '/' + info
        return get_response(pth, headers={}, method='GET').json()

    def rest_api_token(self, expiration=3600):
        __logger__.debug("getting token @ time %s", time.time())
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
                headers={
                    'Authorization': 'Bearer {}'.format(self.token),
                    'Content-Type': 'text/yaml',
                },
                body=job,
                allowed_status=[202, 201]
            )
        else:
            return get_response(
                '{}/rest-server/api/v1/user/{}/jobs'.format(
                    self.pai_uri, self.user),
                headers={
                    'Authorization': 'Bearer {}'.format(self.token),
                    'Content-Type': 'application/json',
                },
                body=job,
                allowed_status=[202, 201]
            )

    def rest_api_execute_job(self, job_name: str, e_type: str = "STOP"):
        assert e_type in [
            "START", "STOP"], "unsupported execute type {}".format(e_type)
        return get_response(
            "{}/rest-server/api/v1/user/{}/jobs/{}/executionType".format(
                self.pai_uri, self.user, job_name),
            headers={
                'Authorization': 'Bearer {}'.format(self.token),
            },
            body={
                "value": e_type
            },
            method="PUT",
            allowed_status=[200, 202],
        ).json()

    def rest_api_virtual_clusters(self):
        return get_response(
            '{}/rest-server/api/v1/virtual-clusters'.format(self.pai_uri),
            headers={
                'Authorization': 'Bearer {}'.format(self.token),
                'Content-Type': 'application/json',
            },
            method='GET',
            allowed_status=[200]
        ).json()

    def rest_api_user(self):
        return get_response(
            '{}/rest-server/api/v1/user/{}'.format(self.pai_uri, self.user),
            method='GET',
            headers={
                'Authorization': 'Bearer {}'.format(self.token),
                'Content-Type': 'text/yaml',
            },
        ).json()

    def virtual_clusters(self, user_info: dict = None):
        user_info = na(user_info, self.rest_api_user())
        my_virtual_clusters = user_info["virtualCluster"]
        if isinstance(my_virtual_clusters, str):
            my_virtual_clusters = my_virtual_clusters.split(",")
        return my_virtual_clusters

    def virtual_cluster_available_resources(self):
        vc_info = self.rest_api_virtual_clusters()
        dic = dict()
        for key, vc in vc_info.items():
            if "resourcesTotal" in vc:
                used, total = vc["resourcesUsed"], vc["resourcesTotal"]
                dic[key] = {
                    k: max(0, int(total[k] - used[k])) for k in total
                }
            else:
                # return -1 if the REST api not supported
                dic[key] = dict(GPUs=-1, memory=-1, vCores=-1)
        return dic

    def available_resources(self):
        my_virtual_clusters = self.rest_api_user()["virtualCluster"]
        if isinstance(my_virtual_clusters, str):
            my_virtual_clusters = my_virtual_clusters.split(",")
        __logger__.debug("user %s belongs to %s",
                         self.user, my_virtual_clusters)
        resources = self.virtual_cluster_available_resources()
        return {k: v for k, v in resources.items() if k in my_virtual_clusters}
