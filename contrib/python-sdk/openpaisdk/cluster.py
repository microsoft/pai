import os
import re
import time
from copy import deepcopy

from openpaisdk import __cluster_config_file__, __logger__
from openpaisdk.cli_arguments import get_args
from openpaisdk.io_utils import from_file, to_file
from openpaisdk.storage import Storage
from openpaisdk.utils import OrganizedList as ol
from openpaisdk.utils import get_response


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
    def make_string(pth: str, target: str, iters=(list, dict)):
        flag = True
        assert isinstance(target, iters), "not supported type %s (%s)" % (
            pth, type(target))
        for i in (target.keys() if isinstance(target, dict) else range(len(target))):
            pth_next = "%s[%s]" % (pth, i)
            if isinstance(target[i], iters):
                flag = flag and Cluster.make_string(pth_next, target[i])
            elif not (target[i] is None or isinstance(target[i], str)):
                __logger__.warn(
                    'only string is allowed in the cluster configuration, %s is %s, replace it by str()', pth_next, type(target[i]))
                target[i] = str(target[i])
                flag = False
        return flag

    @staticmethod
    def attach_storage(c_dic: dict, storage: dict):
        if "user" in storage and not storage["user"]:
            storage["user"] = c_dic["user"]
        return ol.notified_add(c_dic["storages"], "storage_alias", storage)

    @staticmethod
    def validate(cluster: dict):
        assert isinstance(
            cluster, dict), "cluster configuration should be a dict"
        assert isinstance(["storages"], list), "storages should be a list"
        Cluster.make_string(cluster["cluster_alias"], cluster)
        assert cluster["pai_uri"].startswith("http://") or cluster["pai_uri"].startswith(
            "https://"), "pai_uri should be a uri starting with http(s)://"
        assert cluster["user"], "cluster should have a cluster"
        return cluster


class ClusterList:
    """Data structure corresponding to the contents of ~/.openpai/clusters.yaml
    We use an OrganizedList to handle the operations to this class
    """

    def __init__(self, clusters: list = None):
        self.clusters = clusters if clusters else []

    @staticmethod
    def validate(clusters: list):
        assert isinstance(
            clusters, list), "contents in %s should be a list" % __cluster_config_file__
        [Cluster.validate(c) for c in clusters]
        return clusters

    def load(self, fname: str = __cluster_config_file__):
        self.clusters = from_file(fname, default=[])
        ClusterList.validate(self.clusters)
        return self

    def save(self):
        to_file(self.clusters, __cluster_config_file__)

    def tell(self):
        """return the content of clusters, but hide the password"""
        lst = deepcopy(self.clusters)
        for dic in lst:
            dic["password"] = "******"
        return lst

    def add(self, cluster: dict):
        return ol.notified_add(self.clusters, "cluster_alias", Cluster.validate(Cluster.new(cluster)))

    def delete(self, alias: str):
        return ol.delete(self.clusters, "cluster_alias", alias)

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

    def attach_storage(self, alias: str, storage: dict, as_default: bool = False):
        cluster = self.select(alias)
        result = Cluster.attach_storage(cluster, storage)
        if as_default:
            cluster["default_storage_alias"] = storage["storage_alias"]
        return result

    def get_client(self, alias: str):
        return ClusterClient(**self.select(alias))

    def available_resources(self):
        dic = {}
        for cluster in self.clusters:
            try:
                a = cluster["cluster_alias"]
                dic[a] = self.get_client(a).available_resources()
            except Exception as identifier:
                __logger__.exception(identifier)
        return dic


states_successful, states_failed, states_unfinished = [
    "SUCCEEDED"], ["FAILED"], ["WAITING", "RUNNING"]
states_completed = states_successful + states_failed
states_valid = states_completed + states_unfinished


class ClusterClient:
    """A wrapper of cluster to access the REST APIs"""

    def __init__(self, pai_uri: str = None, user: str = None, password: str = None, storages: list = [], default_storage_alias: str = None, **kwargs):
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
        self.__token = dict(token=None, time_stamp=None, expiration=3600)

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

    @property
    def token(self):
        current_time = time.time()
        if not self.__token["token"] or not self.__token["time_stamp"] or current_time - self.__token["time_stamp"] >= 0.9 * self.__token["expiration"]:
            self.__token["token"] = self.rest_api_token(
                self.__token["expiration"])
            self.__token["time_stamp"] = time.time()
        return self.__token["token"]

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

    def rest_api_jobs(self, job_name: str = None, info: str = None, user: str = None):
        user = self.user if user is None else user
        pth = '{}/rest-server/api/v1/user/{}/jobs'.format(self.pai_uri, user)
        if job_name:
            pth = pth + '/' + job_name
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

    def rest_api_virtual_clusters(self):
        return get_response(
            '{}/rest-server/api/v1/virtual-clusters'.format(self.pai_uri),
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

    def wait(self, jobs: list, t_sleep: float = 10, timeout: float = 3600, exit_states: list = None):
        exit_states = states_completed if not exit_states else exit_states
        assert isinstance(jobs, list), "input should be a list of job names"

        t = 0
        while True:
            states = [self.rest_api_jobs(j)["jobStatus"].get(
                "state", None) for j in jobs]
            assert all(
                s in states_valid for s in states), "unknown states founded in %s" % states
            if all(s in exit_states for s in states) or t >= timeout:
                break
            else:
                time.sleep(t_sleep)
                t = t + t_sleep
                print('.', end='', flush=True)
        print('.', flush=True)
        return states

    def logs(self, job_name: str, task_role: str = 'main', index: int = 0, log_type: str = 'stdout'):
        assert log_type in [
            "stdout", "stderr"], "now only support stdout and stderr, not %s" % log_type
        try:
            self.wait([job_name], exit_states=states_completed +
                      states_unfinished)
            info = self.jobs(job_name)
            container = info['taskRoles'][task_role]['taskStatuses'][index]
            container_id = container['containerId']
            if info['jobStatus']['state'] in states_completed:
                path_fmt = "http://{ip}:8188/ws/v1/applicationhistory/containers/{container_id}/logs/{stream}?redirected_from_node=true"
                ip = re.search('://([\d.]+)/yarn',
                               container['containerLog']).group(1)
            else:
                ip = container['containerIp']
                path_fmt = "http://{ip}:8042/ws/v1/node/containers/{container_id}/logs/{stream}"
            path = path_fmt.format(
                ip=ip, container_id=container_id, stream=log_type)
            return get_response(path, method="GET").content
        except:
            return None

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
