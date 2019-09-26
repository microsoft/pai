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


import json
import os
import re
import pathlib
from typing import Union, List
from copy import deepcopy
from html2text import html2text

from openpaisdk.flags import __flags__
from openpaisdk.defaults import get_install_uri, LayeredSettings
from openpaisdk.io_utils import from_file, safe_open, to_file, to_screen
from openpaisdk.utils import Retry, concurrent_map, exception_free, find, get_response, na, na_lazy
from openpaisdk.cluster import get_cluster

__protocol_filename__ = "job_protocol.yaml"
__config_filename__ = "job_config.json"
__protocol_unit_types__ = ["job", "data", "script", "dockerimage", "output"]


class ProtocolUnit:

    @staticmethod
    def validate(u: dict):
        # assert u["protocolVersion"] in ["1", "2", 1, 2], "invalid protocolVersion (%s)" % u["protocolVersion"]
        assert u["type"] in __protocol_unit_types__, "invalid type (%s)" % u["type"]
        assert u["name"], "invalid name"
        # uri: String or list, required # Only when the type is data can the uri be a list.
        assert isinstance(u["uri"], str) or u["type"] == "data" and isinstance(u["uri"], list), "uri: String or list, required # Only when the type is data can the uri be a list. (Error: %s)" % u


class TaskRole:

    @staticmethod
    def validate(t: dict):
        assert t["dockerImage"], "unknown dockerImage"
        assert t["resourcePerInstance"]["cpu"] > 0, "invalid cpu number (%d)" % t["resourcePerInstance"]["cpu"]
        assert t["resourcePerInstance"]["gpu"] >= 0, "invalid gpu number (%d)" % t["resourcePerInstance"]["gpu"]
        assert t["resourcePerInstance"]["memoryMB"] > 0, "invalid memoryMB number (%d)" % t["resourcePerInstance"]["memoryMB"]
        for label, port in t["resourcePerInstance"].get("ports", {}).items():
            assert port >= 0, "invalid port (%s : %d)" % (label, port)
        assert isinstance(t["commands"], list) and t["commands"], "empty commands"


class Deployment:

    @staticmethod
    def validate(d: dict, task_role_names: list):
        assert d["name"], "deployment should have a name"
        for t, c in d["taskRoles"].items():
            assert t in task_role_names, "invalid taskrole name (%s)" % (t)
            assert isinstance(["preCommands"], list), "preCommands should be a list"
            assert isinstance(["postCommands"], list), "postCommands should be a list"


class JobResource:

    def __init__(self, r: dict = None):
        from copy import deepcopy

        def gb2mb(m):
            if not isinstance(m, str) or m.isnumeric():
                return int(m)
            if m.lower().endswith('g'):
                return int(m[:-1]) * 1024
            if m.lower().endswith('gb'):
                return int(m[:-2]) * 1024
            raise ValueError(m)

        r = {} if not r else r
        dic = deepcopy(__flags__.resources_requirements)
        for key in ["cpu", "gpu", "memoryMB", "ports"]:
            if r.get(key, None) is not None:
                dic[key] = int(r[key]) if not key == "ports" else r[key]
        if r.get("mem", None) is not None:
            dic["memoryMB"] = gb2mb(r["mem"])
        self.req = dic

    def add_port(self, name: str, num: int = 1):
        self.req.setdefault("ports", {})[name] = num
        return self

    @property
    def as_dict(self):
        return self.req

    @staticmethod
    def parse_list(lst: List[str]):
        r = []
        for spec in lst:
            s = spec.replace(" ", '').split(",")
            r.append(JobResource({
                "gpu": s[0], "cpu": s[1], "mem": s[2],
            }).as_dict)
        return r


class Job:
    """
    the data structure and methods to describe a job compatible with https://github.com/microsoft/pai/blob/master/docs/pai-job-protocol.yaml
    external methods:
    - I/O
        - save(...) / load(...): store and restore to the disk
    - Job protocol wizard
        - sdk_job_template(...): generate a job template with the sdk (embedding cluster / storage information)
        - one_liner(...): generate a single-taskrole job protocol from commands and other essential information
        - from_notebook(...): generate a job protocol from a jupyter notebook
    - Interaction with clusters
        - submit(...): submit to a cluster, including archiving and uploading local source files
        - wait(...): wait a job until completed
        - log(...):
    - Parse logs
        - connect_jupyter(...): wait job running and connected to jupyter server
    """

    def __init__(self, name: str=None, **kwargs):
        self.protocol = dict()  # follow the schema of https://github.com/microsoft/pai/blob/master/docs/pai-job-protocol.yaml
        self._client = None  # cluster client
        self.new(name, **kwargs)

    def new(self, name: str, **kwargs):
        self.protocol = {
            "name": name,
            "protocolVersion": 2,
            "type": "job",
            "prerequisites": [],
            "parameters": dict(),
            "secrets": dict(),
            "taskRoles": dict(),
            "deployments": [],
            "defaults": dict(),
            "extras": dict(),
        }
        self.protocol.update(kwargs)
        return self

    def load(self, fname: str = None, job_name: str = None, cluster_alias: str = None):
        if cluster_alias:  # load job config from cluster by REST api
            job_name = na(job_name, self.name)
            self.protocol = get_cluster(cluster_alias).rest_api_job_info(job_name, 'config')
        else:  # load from local file
            if not fname:
                fname = Job(job_name).protocol_file
            if os.path.isfile(fname):
                self.protocol = from_file(fname, default="==FATAL==")
        self.protocol.setdefault('protocolVersion', '1')  # v1 protocol (json) has no protocolVersion
        return self

    def save(self):
        if self.name:
            to_file(self.protocol, self.protocol_file)
        return self

    def validate(self):
        assert self.protocolVersion in ["1", "2"], "unknown protocolVersion (%s)" % self.protocol["protocolVersion"]
        assert self.name is not None, "job name is null %s" % self.protocol
        if self.protocolVersion == "2":
            assert self.protocol["type"] == "job", "type must be job (%s)" % self.protocol["type"]
            for t in self.protocol.get("taskRoles", {}).values():
                TaskRole.validate(t)
            for d in self.protocol.get("deployments", []):
                Deployment.validate(d, list(self.protocol["taskRoles"].keys()))
            for u in self.protocol.get("prerequisites", []):
                ProtocolUnit.validate(u)
        return self

    @property
    def protocolVersion(self):
        return str(self.protocol.get("protocolVersion", "1"))

    @property
    def name(self):
        return self.protocol.get("name" if self.protocolVersion == "2" else "jobName", None)

    @property
    def cache_dir(self):
        assert self.name, "cannot get cache directory for an empty job name"
        return os.path.join(__flags__.cache, self.name)

    def cache_file(self, fname):
        return os.path.join(self.cache_dir, fname)

    @property
    def protocol_file(self):
        return self.cache_file(__protocol_filename__)

    @property
    def temp_archive(self):
        return self.cache_file(self.name + ".tar.gz")

    @staticmethod
    def get_config_file(job_name: str, v2: bool=True):
        return Job(job_name).cache_file(__protocol_filename__ if v2 else __config_filename__)

    def param(self, key, default=None, field: str="parameters"):
        return self.protocol.get(field, {}).get(key, default)

    def set_param(self, key, value, field: str="parameters"):
        self.protocol.setdefault(field, {})[key] = value

    def secret(self, key, default=None):
        return self.param(key, default, "secrets")

    def set_secret(self, key, value):
        self.set_param(key, value, "secrets")

    def extra(self, key, default=None):
        return self.param(key, default, "extras")

    def set_extra(self, key, value):
        self.set_param(key, value, "extras")

    def tags(self):
        return self.param("tags", [], "extras")

    def add_tag(self, tag: str):
        lst = self.tags()
        if tag not in lst:
            lst.append(tag)
        self.set_param("tags", lst, "extras")
        return self

    def has_tag(self, tag: str):
        return tag in self.tags()

    def get_config(self):
        if self.protocolVersion == "2":
            self.interpret_sdk_plugin()
            for d in self.protocol.get("deployments", []):
                r = d["taskRoles"]
                t_lst = list(r.keys())
                for t in t_lst:
                    for k in ["preCommands", "postCommands"]:  # pre- / post-
                        if k not in r[t]:
                            continue
                        if len(r[t][k]) == 0:
                            del r[t][k]
                    if len(r[t]) == 0:
                        del r[t]
            for key in ["deployments", "parameters"]:
                if key in self.protocol and len(self.protocol[key]) == 0:
                    del self.protocol[key]
            for t in self.protocol["taskRoles"].values():
                if "ports" in t["resourcePerInstance"] and len(t["resourcePerInstance"]["ports"]) == 0:
                    del t["resourcePerInstance"]["ports"]
            return self.protocol
        else:
            dic = deepcopy(self.protocol)
            del dic["protocolVersion"]
            return dic

    def sdk_job_template(self, cluster_alias_lst: str=[], workspace: str=None, sources: list=None, pip_installs: list=None):
        "generate the job template for a sdk-submitted job"
        # secrets
        clusters = [get_cluster(alias, get_client=False) for alias in cluster_alias_lst]
        workspace = na(workspace, LayeredSettings.get("workspace"))
        workspace = na(workspace, f"{__flags__.storage_root}/{clusters[0]['user']}")
        self.set_secret("clusters", json.dumps(clusters))
        self.set_param("cluster_alias", cluster_alias_lst[0] if cluster_alias_lst else None)
        self.set_param("work_directory", '{}/jobs/{}'.format(workspace, self.name) if workspace else None)

        # parameters
        self.set_param("python_path", "python")

        # signature
        self.add_tag(__internal_tags__["sdk"])

        # sdk.plugins
        sdk_install_uri = "-U {}".format(get_install_uri())
        c_dir = '~/{}'.format(__flags__.cache)
        c_file = '%s/%s' % (c_dir, __flags__.cluster_cfg_file)

        plugins = []
        if sources:
            plugins.append({
                "plugin": "local.uploadFiles",
                "parameters": {
                    "files": list(set([os.path.relpath(s) for s in sources])),
                },
            })

        plugins.extend([
            {
                "plugin": "container.preCommands",  # commands to install essential pip packages
                "parameters": {
                    "commands": [
                        "<% $parameters.python_path %> -m pip install {}".format(p) for p in [sdk_install_uri] + na(pip_installs, [])
                    ]
                }
            },
            {
                "plugin": "container.preCommands",  # copy cluster information
                "parameters": {
                    "commands": [
                        "mkdir %s" % c_dir,
                        "echo \"write config to {}\"".format(c_file),
                        "echo <% $secrets.clusters %> > {}".format(c_file),
                        "opai cluster select <% $parameters.cluster_alias %>",
                    ]
                }
            }
        ])

        if sources:
            a_file = os.path.basename(self.temp_archive)
            plugins.append({
                "plugin": "container.preCommands",
                "parameters": {
                    "commands": [
                        "opai storage download <% $parameters.work_directory %>/source/{} {}".format(a_file, a_file),
                        "tar xvfz {}".format(a_file)
                    ]
                }
            })
        self.set_extra("sdk.plugins", plugins)
        return self

    def one_liner(self,
                  commands: Union[list, str], image: str, cluster: dict, resources: dict=None,
                  sources: list = None, pip_installs: list = None
                  ):
        """generate the single-task-role job protocol from essentials such as commands, docker image...
        :param cluster (dict): a dictionary includes {cluster_alias, virtual_cluster, workspace}
        """
        self.sdk_job_template([cluster["cluster_alias"]], cluster.get("workspace", None), sources, pip_installs)
        self.protocol["prerequisites"].append({
            "name": "docker_image",
            "type": "dockerimage",
            "protocolVersion": "2",
            "uri": image,
        })
        self.protocol.setdefault("taskRoles", {})["main"] = {
            "dockerImage": "docker_image",
            "resourcePerInstance": JobResource(resources).as_dict,
            "commands": commands if isinstance(commands, list) else [commands]
        }
        self.add_tag(__internal_tags__["one_liner"])
        return self

    def from_notebook(self,
                      nb_file: str, mode: str="interactive", token: str="abcd",
                      image: str=None, cluster: dict=None, resources: dict=None,
                      sources: list = None, pip_installs: list = None
                      ):
        """
        mode: interactive / silent / script
        """
        assert mode in ["interactive", "silent", "script"], "unsupported mode %s" % mode
        if not nb_file:
            mode, nb_file = "interactive", ""
        else:
            assert os.path.isfile(nb_file), "cannot read the ipython notebook {}".format(nb_file)
            sources = na(sources, [])
            sources.append(nb_file)
        self.set_param("notebook_file", os.path.splitext(os.path.basename(nb_file))[0] if nb_file else "")
        resources = JobResource(resources)
        if mode == "interactive":
            resources.add_port("jupyter")
            self.set_secret("token", token)
            cmds = [
                " ".join([
                    "jupyter notebook",
                    "--no-browser", "--ip 0.0.0.0", "--port $PAI_CONTAINER_HOST_jupyter_PORT_LIST",
                    "--NotebookApp.token=<% $secrets.token %>",
                    "--allow-root --NotebookApp.file_to_run=<% $parameters.notebook_file %>.ipynb",
                ]),
            ]
        elif mode == "silent":
            cmds = [
                " ".join([
                    "jupyter nbconvert --ExecutePreprocessor.timeout=-1 --ExecutePreprocessor.allow_errors=True",
                    "--to html --execute <% $parameters.notebook_file %>.ipynb",
                ]),
                "opai storage upload <% $parameters.notebook_file %>.html <% $parameters.work_directory %>/output/<% $parameters.notebook_file %>.html",
            ]
        else:
            cmds = [
                "jupyter nbconvert --to script <% $parameters.notebook_file %>.ipynb --output openpai_submitter_entry",
                "echo ======================== Python Script Starts ========================",
                # execute notebook by iPython. To remove color information, we use "--no-term-title" and sed below
                """ipython --no-term-title openpai_submitter_entry.py | sed -r "s/\\x1B\\[([0-9]{1,2}(;[0-9]{1,2})?)?[mGK]//g" | tr -dc '[[:print:]]\\n'""",
            ]
        self.one_liner(cmds, image, cluster, resources.as_dict, sources, na(pip_installs, []) + ["jupyter"])
        mode_to_tag = {"interactive": "interactive_nb", "silent": "batch_nb", "script": "script_nb"}
        self.add_tag(__internal_tags__[mode_to_tag[mode]])
        return self

    def interpret_sdk_plugin(self):
        plugins = self.extra("sdk.plugins", [])
        # concatenate commands
        if len(self.protocol.setdefault("deployments", [])) == 0:  # will move to plugin fields when it is ready
            # we could use a new deployments for every pre- / post- commands plugin
            deployment_name, task_role_names = "sdk_deployment", list(self.protocol["taskRoles"])
            deployment = {key: dict(preCommands=[], postCommands=[]) for key in task_role_names}
            plugins_to_remove = []
            for i, plugin in enumerate(plugins):
                target = find("container.(\w+)", plugin["plugin"])
                if target not in ["preCommands", "postCommands"]:
                    continue
                for t in plugin.get("taskRoles", task_role_names):
                    deployment[t][target].extend(plugin["parameters"]["commands"])
                plugins_to_remove.append(i)
            if plugins_to_remove:
                self.protocol["deployments"].append({
                    "name": deployment_name,
                    "taskRoles": deployment,
                })
                self.protocol.setdefault("defaults", {})["deployment"] = deployment_name
                for i in reversed(plugins_to_remove):
                    del plugins[i]
        return self

    @property
    def client(self):
        if self._client is None:
            alias = self.param("cluster_alias")
            if alias:
                self._client = get_cluster(alias)
        return self._client

    def select_cluster(self, cluster_alias: str=None, virtual_cluster: str=None):
        self._client = get_cluster(cluster_alias)
        if virtual_cluster:
            if self.protocolVersion == "1":
                self.protocol["virtualCluster"] = virtual_cluster
            else:
                self.set_param("virtualCluster", virtual_cluster, field="defaults")
        return self

    # methods only for SDK-enabled jobs
    def submit(self, cluster_alias: str = None, virtual_cluster: str = None):
        cluster_alias = na(cluster_alias, self.param("cluster_alias", None))
        self.select_cluster(cluster_alias, virtual_cluster)
        self.validate().local_process()
        to_screen("submit job %s to cluster %s" % (self.name, cluster_alias))
        try:
            self.client.rest_api_submit(self.get_config())
            job_link = self.client.get_job_link(self.name)
            return {"job_link": job_link, "job_name": self.name}
        except Exception as identifier:
            to_screen(f"submit failed due to {repr(identifier)}", _type="error")
            to_screen(self.get_config())
            raise identifier

    def stop(self):
        return self.client.rest_api_execute_job(self.name)

    def get_status(self):
        return self.client.rest_api_job_info(self.name)

    def wait(self, t_sleep: float = 10, timeout: float = 3600, silent: bool = False):
        """for jupyter job, wait until ready to connect
        for normal job, wait until completed"""
        exit_states = __job_states__["completed"]
        repeater = Retry(timeout=timeout, t_sleep=t_sleep, silent=silent)
        interactive_nb = self.has_tag(__internal_tags__["interactive_nb"])
        batch_nb = self.has_tag(__internal_tags__["batch_nb"])
        if interactive_nb or batch_nb:
            if interactive_nb:
                to_screen("{} is recognized to be an interactive jupyter notebook job".format(self.name))
                to_screen("notebook job needs to be RUNNING state and the kernel started")
            if batch_nb:
                to_screen("{} is recognized to be a silent jupyter notebook job".format(self.name))
                to_screen("notebook job needs to be SUCCEEDED state and the output is ready")
            return repeater.retry(
                lambda x: x.get('state', None) in exit_states or x.get("notebook", None) is not None,
                self.connect_jupyter
            )
        to_screen("wait until job to be completed ({})".format(exit_states))
        return repeater.retry(
            lambda x: JobStatusParser.state(x) in exit_states,  # x: job status
            self.get_status
        )

    def plugin_uploadFiles(self, plugin: dict):
        import tarfile
        to_screen("archiving and uploading ...")
        work_directory = self.param("work_directory")
        assert work_directory, "must specify a storage to upload"
        with safe_open(self.temp_archive, "w:gz", func=tarfile.open) as fn:
            for src in plugin["parameters"]["files"]:
                src = os.path.relpath(src)
                if os.path.dirname(src) != "":
                    to_screen("files not in current folder may cause wrong location when unarchived in the container, please check it {}".format(src), _type="warn")
                fn.add(src)
                to_screen("{} archived and wait to be uploaded".format(src))
        self.client.get_storage().upload(
            local_path=self.temp_archive,
            remote_path="{}/source/{}".format(work_directory, os.path.basename(self.temp_archive)),
            overwrite=True
        )

    def local_process(self):
        "pre-process the job protocol locally, including uploading files, deal with pre-/post- commands"
        self.validate()
        plugins = self.protocol.get("extras", {}).get("sdk.plugins", [])
        for plugin in plugins:
            s = find("local.(\w+)", plugin["plugin"])
            if not s:
                continue
            getattr(self, "plugin_" + s)(plugin)
        return self

    def connect_jupyter(self):
        if self.has_tag(__internal_tags__["script_nb"]):
            return self.connect_jupyter_script()
        if self.has_tag(__internal_tags__["batch_nb"]):
            return self.connect_jupyter_batch()
        if self.has_tag(__internal_tags__["interactive_nb"]):
            return self.connect_jupyter_interactive()

    def connect_jupyter_batch(self):
        "fetch the html result if ready"
        status = self.get_status()
        state = JobStatusParser.state(status)
        url = None
        if state in __job_states__["successful"]:
            html_file = self.param("notebook_file") + ".html"
            local_path = html_file
            remote_path = '{}/output/{}'.format(self.param("work_directory"), html_file)
            self.client.get_storage().download(remote_path=remote_path, local_path=local_path)
            url = pathlib.Path(os.path.abspath(html_file)).as_uri()
        return dict(state=state, notebook=url)

    def connect_jupyter_interactive(self):
        "get the url of notebook if ready"
        status = self.get_status()
        nb_file = self.param("notebook_file") + ".ipynb" if self.param("notebook_file") else None
        return JobStatusParser.interactive_jupyter_url(status, nb_file)

    def connect_jupyter_script(self):
        status = self.get_status()
        state = self.state(status)
        return dict(state=state, notebook=None)


__internal_tags__ = {
    "sdk": "py-sdk",
    "one_liner": 'py-sdk-one-liner',
    "interactive_nb": 'py-sdk-notebook-interactive',
    "batch_nb": 'py-sdk-notebook-batch',
    "script_nb": 'py-sdk-notebook-script',
}


__job_states__ = {
    "successful": ["SUCCEEDED"],
    "failed": ["FAILED", "STOPPED"],
    "ongoing": ["WAITING", "RUNNING", "COMPLETING"],
}
__job_states__["completed"] = __job_states__["successful"] + __job_states__["failed"]
__job_states__["ready"] = __job_states__["completed"] + ["RUNNING"]
__job_states__["valid"] = [s for sub in __job_states__.values() for s in sub]


class JobStatusParser:

    @staticmethod
    @exception_free(KeyError, None)
    def state(status: dict):
        return status["jobStatus"]["state"]

    @staticmethod
    @exception_free(KeyError, None)
    def single_task_logs(status: dict, task_role: str = 'main', index: int = 0, log_type: dict=None, return_urls: bool=False):
        """change to use containerLog"""
        log_type = na(log_type, {
            "stdout": "user.pai.stdout/?start=0",
            "stderr": "user.pai.stderr/?start=0"
        })
        containers = status.get("taskRoles", {}).get(task_role, {}).get("taskStatuses", [])
        if len(containers) < index + 1:
            return None
        containerLog = containers[index].get("containerLog", None)
        if not containerLog:
            return None
        urls = {
            k: "{}{}".format(containerLog, v)
            for k, v in log_type.items()
        }
        if return_urls:
            return urls
        else:
            html_contents = {k: get_response('GET', v).text for k, v in urls.items()}
            try:
                from html2text import html2text
                return {k: html2text(v) for k, v in html_contents.items()}
            except ImportError:
                return html_contents

    @staticmethod
    @exception_free(Exception, None)
    def all_tasks_logs(status: dict):
        """retrieve logs of all tasks"""
        logs = {
            'stdout': {}, 'stderr': {}
        }
        for tr_name, tf_info in status['taskRoles'].items():
            for task_status in tf_info['taskStatuses']:
                task_id = '{}[{}]'.format(tr_name, task_status['taskIndex'])
                task_logs = JobStatusParser.single_task_logs(status, tr_name, task_status['taskIndex'])
                for k, v in task_logs.items():
                    logs.setdefault(k, {})[task_id] = v
        return logs

    @staticmethod
    @exception_free(Exception, dict(state=None, notebook=None))
    def interactive_jupyter_url(status: dict, nb_file: str=None, task_role: str='main', index: int= 0):
        "get the url of notebook if ready"
        state = JobStatusParser.state(status)
        url = None
        if state == "RUNNING":
            job_log = JobStatusParser.single_task_logs(
                status, task_role, index
            )["stderr"].split('\n')
            for line in job_log:
                if re.search("The Jupyter Notebook is running at:", line):
                    from openpaisdk.utils import path_join
                    container = status["taskRoles"][task_role]["taskStatuses"][index]
                    ip, port = container["containerIp"], container["containerPorts"]["jupyter"]
                    url = path_join([f"http://{ip}:{port}", "notebooks", nb_file])
                    break
        return dict(state=state, notebook=url)


def job_spider(cluster, jobs: list = None):
    jobs = na_lazy(jobs, cluster.rest_api_job_list)
    to_screen("{} jobs to be captured in the cluster {}".format(len(jobs), cluster.alias))
    job_statuses = concurrent_map(
        lambda j: cluster.rest_api_job_info(j['name'], info=None, user=j['username']),
        jobs
    )
    job_configs = concurrent_map(
        lambda j: cluster.rest_api_job_info(j['name'], info='config', user=j['username']),
        jobs
    )
    job_logs = concurrent_map(JobStatusParser.all_tasks_logs, job_statuses)
    for job, sta, cfg, logs in zip(jobs, job_statuses, job_configs, job_logs):
        job['status'] = sta
        job['config'] = cfg
        job['logs'] = logs
    return jobs
