#!/usr/bin/env python

import sys
import yaml
import json
import codecs
import re
import logging
import attr
import urlparse

logger = logging.getLogger(__name__)


def get_required_field(obj, field, err_msg):
    if obj.get(field) is None:
        raise RuntimeError(err_msg)
    return obj[field]


@attr.s
class Prerequisite(object):
    name = attr.ib() # required
    type = attr.ib() # required
    contributor = attr.ib() # optional
    desc = attr.ib() # optional
    uri = attr.ib() # required

    @staticmethod
    def get_or_fail(obj, key):
        return get_required_field(obj, key, key + " in prerequisite is required field")

    @staticmethod
    def parse(obj):
        version = obj.get("protocol_version", "v2")
        if version != "v2":
            raise RuntimeError("unknown protocol version " + version)

        name = Prerequisite.get_or_fail(obj, "name")
        uri = Prerequisite.get_or_fail(obj, "uri")

        return Prerequisite(name=name,
                type=obj.get("type"),
                contributor=obj.get("contributor"),
                desc=obj.get("description"),
                uri=uri)

    def validate(self):
        if self.type not in {"data", "script", "dockerimage"}:
            raise RuntimeError("type of prerequisite must be data/script/dockerimage")

    def expand_to_command(self):
        cmds = []
        if self.type in {"data", "script"}:
            result = urlparse.urlparse(self.uri)
            repo = self.uri.split("/")[-1]

            if result.netloc is not None and result.netloc.endswith("github.com"):
                url, sha = self.uri.split("@")
                cmds.append("git clone " + url)
                cmds.append("cd " + repo + "; git checkout " + sha + "; cd ..;")
                cmds.append("mv " + repo + " " + self.name)
            else:
                cmds.append("mkdir " + self.name)
                cmds.append("wget " + self.uri)
                if repo.endswith(".gz"):
                    cmds.append("gunzip " + repo)
                    repo = repo[:-3]
                if repo.endswith(".tar"):
                    cmds.append("mkdir " + self.name);
                    cmds.append("tar xvf " + repo + " -C " + self.name + " --strip-components 1");
                if repo.endswith(".zip"):
                    cmds.append("unzip " + repo)
                    cmds.append("mv " + repo + " " + self.name)

        return cmds



@attr.s
class ResourcePerInstance(object):
    cpu = attr.ib() # required
    memory_mb = attr.ib() # required
    shm_mb = attr.ib() # optional default to 64
    gpu = attr.ib() # required

    @staticmethod
    def parse(obj):
        cpu = int(get_required_field(obj, "cpu",
            "cpu in resourcePerInstance is required"))
        memory_mb = int(get_required_field(obj, "memoryMB",
            "memoryMB in resourcePerInstance is required"))
        gpu = int(get_required_field(obj, "gpu",
            "gpu in resourcePerInstance is required"))

        shm_mb = int(obj.get("shmMB", "64"))
        return ResourcePerInstance(cpu=cpu, memory_mb=memory_mb, shm_mb=shm_mb, gpu=gpu)

    def validate(self):
        if self.cpu < 1:
            raise RuntimeError("cpu should be larger than or equal to 1")
        if self.memory_mb < 100:
            raise RuntimeError("memoryMB should be larger than or equal to 100")
        if self.gpu < 0:
            raise RuntimeError("gpu should be larger than or equal to 0")
        if self.shm_mb > self.memory_mb:
            raise RuntimeError("shmMB should be less than memoryMB")

    def to_crd(self):
        result = {
                "cpu": str(self.cpu) + "m",
                "memory": str(self.memory_mb) + "Mi"
                }
        if self.gpu > 0:
            result["nvidia.com/gpu"] = self.gpu

        return result

@attr.s
class Port(object):
    label = attr.ib() # optional
    begin_at = attr.ib() # required
    port_number = attr.ib() # required

    @staticmethod
    def parse(obj):
        label = obj.get("label")
        begin_at = int(get_required_field(obj, "beginAt", "beginAt is required"))
        port_number = int(get_required_field(obj, "portNumber", "portNumber is required"))
        return Port(label=label, begin_at=begin_at, port_number=port_number)

    def validate(self):
        if self.label is not None and re.match("^[A-Za-z0-9._~]+$", self.label) is None:
            raise RuntimeError("label in port should match [A-Za-z0-9._~]+")


@attr.s
class Resource(object):
    instances = attr.ib() # optional default to 1
    resource_per_instance = attr.ib() # required
    port_list = attr.ib() # optional default to []

    @staticmethod
    def parse(obj):
        instances = int(obj.get("instances", "1"))
        resource_per_instance = ResourcePerInstance.parse(
                get_required_field(obj, "resourcePerInstance",
                    "resourcePerInstance in resource is required"))

        ports = obj.get("portList", [])
        port_list = []
        for port in ports:
            port_list.append(Port.parse(port))

        return Resource(instances=instances, resource_per_instance=resource_per_instance,
                port_list=port_list)

    def validate(self):
        self.resource_per_instance.validate()

        for port in self.port_list:
            port.validate()

    def to_crd(self):
        return self.resource_per_instance.to_crd()


def parse_prerequisites(obj):
    result = {}
    if obj is None:
        return result

    for pre in obj:
        parsed = Prerequisite.parse(pre)
        result[parsed.name] = parsed

    return result


def parse_parameters(obj, parameters):
    result = {}
    if obj is not None:
        for k, v in obj.items():
            result[k] = replace_parameters(v, parameters)
    return result


def replace_parameters(value, parameters):
    if value is None or type(value) != str:
        return value

    pattern = re.compile(u"\\$\\$([A-Za-z0-9\\.\\_]+)\\$\\$")
    groups = re.findall(pattern, value)
    for match in groups:
        if match not in parameters:
            raise RuntimeError("unknown parameter " + match + " in str " + value)
        value = value.replace("$$" + match + "$$", str(parameters[match]))

    return value


def get_prerequisites(prerequisites, value):
    if value is None:
        return None

    if value not in prerequisites:
        raise RuntimeError("unknown prerequisites {}, available {}".format(value, prerequisites))

    return prerequisites[value]


@attr.s
class Task(object):
    role = attr.ib() # required
    data = attr.ib() # optional
    script = attr.ib() # optional
    docker_image = attr.ib() # optional
    resource = attr.ib() # required
    min_failed_task_count = attr.ib() # optional
    min_succeeded_task_count = attr.ib() # optional
    command = attr.ib() # required

    @staticmethod
    def parse(obj, parameters, prerequisites):
        role = get_required_field(obj, "role", "role is required field in task")

        current_parameters = parse_parameters(obj.get("parameters"), parameters)

        data = replace_parameters(obj.get("data"), current_parameters)
        script = replace_parameters(obj.get("script"), current_parameters)
        docker_image = replace_parameters(obj.get("dockerimage"), current_parameters)

        data = get_prerequisites(prerequisites, data)
        script = get_prerequisites(prerequisites, script)
        docker_image = get_prerequisites(prerequisites, docker_image)

        resource = Resource.parse(get_required_field(obj, "resource",
            "resource field in task is required"))

        min_failed_task_count = obj.get("minFailedTaskCount")
        min_succeeded_task_count = obj.get("minSucceededTaskCount")

        cmds = get_required_field(obj, "command", "command in task is required")

        command = []
        for cmd in cmds:
            command.append(replace_parameters(cmd, current_parameters))

        return Task(role=role, data=data, script=script, docker_image=docker_image,
                resource=resource, min_failed_task_count=min_failed_task_count,
                min_succeeded_task_count=min_succeeded_task_count,
                command=command)

    def process_prerequisite(self):
        data_cmd = script_cmd = []
        if self.data is not None:
            data_cmd = self.data.expand_to_command()
        if self.script is not None:
            script_cmd = self.script.expand_to_command()
        if self.docker_image is not None:
            self.docker_image = self.docker_image.uri

        self.command = data_cmd + script_cmd + self.command

    def validate(self):
        if self.role is not None and re.match("^[A-Za-z0-9._~]+$", self.role) is None:
            raise RuntimeError("role in task should match [A-Za-z0-9._~]+")

        self.resource.validate()

        if self.min_failed_task_count is not None and self.min_failed_task_count < 1:
            raise RuntimeError("minFailedTaskCount in task should larger than 1")

        if self.min_succeeded_task_count is not None and self.min_succeeded_task_count < 1:
            raise RuntimeError("minSucceededTaskCount in task should larger than 1")

    def to_crd(self):
        image = "busybox"
        if self.docker_image is not None:
            image = self.docker_image

        result = {
                "name": self.role,
                "taskNumber": self.resource.instances,
                "frameworkAttemptCompletionPolicy": {
                    "minFailedTaskCount": self.min_failed_task_count,
                    "minSucceededTaskCount": self.min_succeeded_task_count
                    },
                "task": {
                    "retryPolicy": {
                        "fancyRetryPolicy": False
                        },
                    "pod": {
                        "spec": {
                            "restartPolicy": "Never",
                            "containers": [
                                {
                                "name": self.role,
                                "image": image,
                                "ports": {},
                                "command": self.command,
                                "resource": self.resource.to_crd()
                                }
                                ]
                            }
                        }
                    }
                }

        return result


def parse_tasks(obj, parameters, prerequisites):
    tasks = {}

    if len(obj.get("tasks", [])) == 0:
        raise RuntimeError("should specify at least one task")

    for task in obj["tasks"]:
        task = Task.parse(task, parameters, prerequisites)
        if task.role in tasks:
            raise RuntimeError("role name in task should be unique")
        tasks[task.role] = task

    return tasks


@attr.s
class Job(object):
    name = attr.ib() # required
    version = attr.ib() # optional
    contributor = attr.ib() # optional
    desc = attr.ib() # optional
    virtual_cluster = attr.ib() # optional default to "default"
    retry_count = attr.ib() # optional default to 0
    gpu_type = attr.ib() # optional
    tasks = attr.ib() # required

    @staticmethod
    def parse(obj):
        protocol_version = obj.get("protocol_version", "v2")
        if protocol_version != "v2":
            raise RuntimeError("unknown protocol version " + version)

        name = get_required_field(obj, "name", "name field is required")

        type = obj.get("type")
        if type != "job":
            raise RuntimeError("type must not be omitted and should be job")

        version = obj.get("version")
        contributor = obj.get("contributor")
        desc = obj.get("description")
        vc = obj.get("virtualCluster")
        retry_count = int(obj.get("retryCount", "0"))
        gpu_type = obj.get("gpuType")

        parameters = parse_parameters(obj.get("parameters"), {})
        prerequisites = parse_prerequisites(obj.get("prerequisites"))

        tasks = parse_tasks(obj, parameters, prerequisites)

        return Job(name=name, version=version, contributor=contributor, desc=desc,
                virtual_cluster=vc, retry_count=retry_count, gpu_type=gpu_type, tasks=tasks)


    def process_prerequisite(self):
        for role, task in self.tasks.items():
            task.process_prerequisite()

    def validate(self):
        if self.name is not None and re.match("^[A-Za-z0-9._~]+$", self.name) is None:
            raise RuntimeError("job name should match [A-Za-z0-9._~]+")

        for role, task in self.tasks.items():
            task.validate()


    def to_crd(self):
        desc = self.desc
        if desc is None:
            desc = "job of " + self.name

        retry_policy = {"fancyRetryPolicy": False}
        restart_policy = "Never"

        result = {
                "apiVersion": "launcher.microsoft.com/v1",
                "kind": "Framework",
                "metadata": {"name": self.name},
                "spec": {
                    "description": desc,
                    "retryPolicy": {
                        "fancyRetryPolicy": False,
                        "maxRetryCount": self.retry_count
                        }
                    }
                }

        # ignore version, contributor, virtual_cluster, gpu_type

        result["taskRoles"] = map(lambda task: task.to_crd(), self.tasks.values())

        return result


def parse_job(obj):
    job = Job.parse(obj)

    job.process_prerequisite()
    job.validate()

    return job


if __name__ == '__main__':
    logging.basicConfig(format="%(asctime)s - %(levelname)s - %(filename)s:%(lineno)s - %(message)s",
                        level=logging.INFO)

    obj = yaml.load(sys.stdin.read())

    job = parse_job(obj)
    print yaml.dump(job.to_crd())
