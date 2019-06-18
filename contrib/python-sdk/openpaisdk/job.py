import argparse
import os
from typing import Union
from copy import deepcopy

from openpaisdk import (__cluster_config_file__, __defaults__, __install__,
                        __jobs_cache__, __logger__, __sdk_branch__)
from openpaisdk.cli_arguments import Namespace, cli_add_arguments, not_not, get_args
from openpaisdk.io_utils import from_file, to_file
from openpaisdk.utils import OrganizedList as ol
from openpaisdk.utils import merge_two_object, psel


__protocol_filename__ = "job_protocol.yaml"
__config_filename__ = "job_config.json"
__protocol_unit_types__ = ["job", "data", "script", "dockerimage", "output"]


class ProtocolUnit:

    @staticmethod
    def validate(u: dict):
        assert u["protocolVersion"] in ["1", "2", 1, 2], "invalid protocolVersion (%s)" % u["protocolVersion"]
        assert u["type"] in __protocol_unit_types__, "invalid type (%s)" % u["type"]
        assert u["name"], "invalid name"
        if u["type"] == "dockerimage":
            assert u["uri"], "dockerimage must have a uri"

class TaskRole:

    @staticmethod
    def validate(t: dict):
        assert t["dockerImage"], "unkown dockerImage"
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


class Job:

    def __init__(self):
        self.protocol = dict() # follow the schema of https://github.com/microsoft/pai/blob/master/docs/pai-job-protocol.yaml

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

    def load(self, fname: str=None, job_name: str=None):
        if not fname:
            fname = Job.job_cache_file(job_name)
        self.protocol = from_file(fname, default={})
        self.protocol.setdefault('protocolVersion', '1') # v1 protocol (json) has no protocolVersion
        return self

    def save(self):
        if self.name:
            to_file(self.protocol, Job.job_cache_file(self.name))
        return self

    def add_taskrole(self, name: str, t_cfg: dict):
        self.protocol["taskRoles"].setdefault(name, {}).update(t_cfg)
        return self

    def validate(self):
        assert self.protocolVersion in ["1", "2"], "unknown protocolVersion (%s)" % self.protocol["protocolVersion"]
        assert self.name is not None, "job name is null %s" % self.protocol
        if self.protocolVersion == "2":
            assert self.protocol["type"] == "job", "type must be job (%s)" % self.protocol["type"]
            for t in self.protocol["taskRoles"].values():
                TaskRole.validate(t)
            for d in self.protocol.get("deployments", []):
                Deployment.validate(d, list(self.protocol["taskRoles"].keys()))
        return self

    @property
    def protocolVersion(self):
        return str(self.protocol.get("protocolVersion", "1"))

    @property
    def name(self):
        return self.protocol.get("name" if self.protocolVersion == "2" else "jobName", None)

    @staticmethod
    def job_cache_file(job_name: str, fname: str=__protocol_filename__):
        return os.path.join(__jobs_cache__, job_name, fname)

    @staticmethod
    def get_config_file(job_name: str, v2: bool=True):
        return Job.job_cache_file(job_name, __protocol_filename__ if v2 else __config_filename__)

    def get_config(self):
        if self.protocolVersion == "2":
            if "deployments" in self.protocol and len(self.protocol["deployments"]) == 0:
                del self.protocol["deployments"]
            for t in self.protocol["taskRoles"].values():
                if "ports" in t["resourcePerInstance"] and len(t["resourcePerInstance"]["ports"]) == 0:
                    del t["resourcePerInstance"]["ports"]
            return self.protocol
        else:
            dic = deepcopy(self.protocol)
            del dic["protocolVersion"]
            return dic

    # methods only for SDK-enabled jobs
    def one_liner(self, commands: Union[list, str], image: str, workspace: str=None, gpu: int=0, cpu: int=1, memoryMB: int=10240, ports: dict={}, **kwargs):
        self.protocol["prerequisites"].append(Job.new_unit("docker_image", "dockerimage", uri=image))
        self.add_taskrole("main", {
            "dockerImage": "docker_image",
            "resourcePerInstance": {
                "gpu": gpu, "cpu": cpu, "memoryMB": memoryMB, "ports": ports
            },
            "commands": commands if isinstance(commands, list) else [commands]
        })
        self.protocol["extras"]["workspace"] = workspace
        self.protocol["extras"]["submitFrom"] = "python-sdk@" + __sdk_branch__

    @staticmethod
    def new_unit(name: str, type: str, protocolVersion: int=2, **kwargs):
        return get_args()
