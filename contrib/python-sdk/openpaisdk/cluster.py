# Copyright (c) Microsoft Corporation
# All rights reserved.
#
# MIT License
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
# documentation files (the "Software"), to deal in the Software without restriction, including without limitation
# the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
# to permit persons to whom the Software is furnished to do so, subject to the following conditions:
# The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
# BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
# DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


from openpaisdk.io_utils import from_file, to_file, to_screen
from openpaisdk.storage import Storage
from openpaisdk.utils import OrganizedList
from openpaisdk.utils import get_response, na, exception_free, RestSrvError, concurrent_map


def get_cluster(alias: str, fname: str = None, get_client: bool = True):
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
        self.clusters = OrganizedList(clusters, _key="cluster_alias") if clusters else []

    def load(self, fname: str = None):
        fname = na(fname, self.default_config_file)
        self.clusters = OrganizedList(from_file(fname, default=[]), _key="cluster_alias")
        return self

    def save(self):
        to_file(self.clusters.as_list, self.default_config_file)

    @property
    def default_config_file(self):
        from openpaisdk.flags import __flags__
        from openpaisdk.defaults import get_defaults
        return __flags__.get_cluster_cfg_file(get_defaults()["clusters-in-local"])

    def tell(self):
        return {
            a: {
                v: dict(GPUs='-', memory='-', vCores='-', uri=cfg["pai_uri"], user=cfg["user"]) for v in cfg["virtual_clusters"]
            } for a, cfg in self.clusters.as_dict.items()
        }

    def add(self, cluster: dict):
        cfg = Cluster().load(**cluster).check().config
        self.clusters.add(cfg, replace=True)
        return self

    def update_all(self):
        for a in self.aliases:
            self.add(self.clusters.first(a))

    def delete(self, alias: str):
        return self.clusters.remove(alias)

    def select(self, alias: str):
        return self.clusters.first(alias)

    def get_client(self, alias: str):
        return Cluster().load(**self.select(alias))

    def available_resources(self):
        """concurrent version to get available resources"""
        aliases = self.aliases
        ret = concurrent_map(Cluster.available_resources, (self.get_client(a) for a in aliases))
        return {a: r for a, r in zip(aliases, ret) if r is not None}

    @property
    def aliases(self):
        return [c["cluster_alias"] for c in self.clusters if "cluster_alias" in c]

    @property
    def alias(self):
        return self.config["cluster_alias"]


class Cluster:
    """A wrapper of cluster to access the REST APIs"""

    def __init__(self, toke_expiration: int = 3600):
        # ! currently sdk will not handle toke refreshing
        self.config = {}
        self.__token_expire = toke_expiration
        self.__token = None

    def load(self, cluster_alias: str = None, pai_uri: str = None, user: str = None, password: str = None, token: str = None, **kwargs):
        import re
        self.config.update(
            cluster_alias=cluster_alias,
            pai_uri=pai_uri.strip("/"),
            user=user,
            password=password,
            token=token,
        )
        self.config.update(
            {k: v for k, v in kwargs.items() if k in ["info", "storages", "virtual_clusters"]}
        )
        # validate
        assert self.alias, "cluster must have an alias"
        assert self.user, "must specify a user name"
        assert re.match("^(http|https)://(.*[^/])$",
                        self.pai_uri), "pai_uri should be a uri in the format of http(s)://x.x.x.x"
        return self

    def check(self):
        to_screen("try to connect cluster {}".format(self.alias))
        storages = self.rest_api_storages()
        for i, s in enumerate(storages):
            s.setdefault("storage_alias", s["protocol"] + f'-{i}')
        cluster_info = na(self.rest_api_cluster_info(), {})
        if cluster_info.get("authnMethod", "basic") == "OIDC":
            assert self.config["token"], "must use authentication token (instead of password) in OIDC mode"
        self.config.update(
            info=cluster_info,
            storages=storages,
            virtual_clusters=self.virtual_clusters(),
        )
        # ! will check authentication types according to AAD enabled or not
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

    def get_storage(self, alias: str = None):
        # ! every cluster should have a builtin storage
        for sto in self.config.get("storages", []):
            if alias is None or sto["storage_alias"] == alias:
                if sto["protocol"] == 'hdfs':
                    return Storage(protocol='webHDFS', url=sto["webhdfs"], user=sto.get('user', self.user))

    def get_job_link(self, job_name: str):
        return '{}/job-detail.html?username={}&jobName={}'.format(self.pai_uri, self.user, job_name)

    @property
    def rest_srv(self):
        return '{}/rest-server/api'.format(self.pai_uri)

    # ! for some older version that does not support this API
    @exception_free(Exception, None, "Cluster info API is not supported")
    def rest_api_cluster_info(self):
        "refer to https://github.com/microsoft/pai/pull/3281/"
        return get_response('GET', [self.rest_srv, 'v1'], allowed_status=[200]).json()

    def rest_api_storages(self):
        # ! currently this is a fake
        return [
            {
                "protocol": "hdfs",
                "webhdfs": f"{self.pai_uri}/webhdfs"
            },
        ]

    @exception_free(RestSrvError, None)
    def rest_api_job_list(self, user: str = None):
        return get_response(
            'GET', [self.rest_srv, 'v1', ('user', user), 'jobs']
        ).json()

    @exception_free(RestSrvError, None)
    def rest_api_job_info(self, job_name: str = None, info: str = None, user: str = None):
        import json
        import yaml
        user = self.user if user is None else user
        assert info in [None, 'config', 'ssh'], ('unsupported query information', info)
        response = get_response(
            'GET', [self.rest_srv, 'v1', 'user', user, 'jobs', job_name, info]
        )
        try:
            return response.json()
        except json.decoder.JSONDecodeError:
            return yaml.load(response.text, Loader=yaml.FullLoader)
        else:
            raise RestSrvError

    @exception_free(Exception, None)
    def rest_api_token(self, expiration=3600):
        return get_response(
            'POST', [self.rest_srv, 'v1', 'token'],
            body={
                'username': self.user, 'password': self.password, 'expiration': expiration
            }
        ).json()['token']

    def rest_api_submit(self, job: dict):
        use_v2 = str(job.get("protocolVersion", 1)) == "2"
        if use_v2:
            import yaml
            return get_response(
                'POST', [self.rest_srv, 'v2', 'jobs'],
                headers={
                    'Authorization': 'Bearer {}'.format(self.token),
                    'Content-Type': 'text/yaml',
                },
                body=yaml.dump(job),
                allowed_status=[202, 201]
            )
        else:
            return get_response(
                'POST', [self.rest_srv, 'v1', 'user', self.user, 'jobs'],
                headers={
                    'Authorization': 'Bearer {}'.format(self.token),
                    'Content-Type': 'application/json',
                },
                body=job,
                allowed_status=[202, 201]
            )

    @exception_free(RestSrvError, None)
    def rest_api_execute_job(self, job_name: str, e_type: str = "STOP"):
        assert e_type in ["START", "STOP"], "unsupported execute type {}".format(e_type)
        return get_response(
            'PUT', [self.rest_srv, 'v1', 'user', self.user, 'jobs', job_name, 'executionType'],
            headers={
                'Authorization': 'Bearer {}'.format(self.token),
            },
            body={
                "value": e_type
            },
            allowed_status=[200, 202],
        ).json()

    @exception_free(RestSrvError, None)
    def rest_api_virtual_clusters(self):
        return get_response(
            'GET', [self.rest_srv, 'v1', 'virtual-clusters'],
            headers={
                'Authorization': 'Bearer {}'.format(self.token),
                'Content-Type': 'application/json',
            },
            allowed_status=[200]
        ).json()

    @exception_free(RestSrvError, None)
    def rest_api_user(self, user: str = None):
        return get_response(
            'GET', [self.rest_srv, 'v1', 'user', user if user else self.user],
            headers={
                'Authorization': 'Bearer {}'.format(self.token),
            },
        ).json()

    def virtual_clusters(self, user_info: dict = None):
        user_info = na(user_info, self.rest_api_user())
        assert user_info, f'failed to get user information from {self.alias}'
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

    @exception_free(Exception, None)
    def available_resources(self):
        resources = self.virtual_cluster_available_resources()
        return {k: v for k, v in resources.items() if k in self.config["virtual_clusters"]}
