import argparse
import json
import os
import sys
from copy import deepcopy

import yaml

import openpaisdk as pai
import openpaisdk.runtime_requires as req
from openpaisdk import __logger__
from openpaisdk.cli_arguments import Namespace, cli_add_arguments, not_not
from openpaisdk.cli_factory import Action, ActionFactory, EngineFactory, Scene
from openpaisdk.core import ClusterClient
from openpaisdk.io_utils import from_file, to_file
from openpaisdk.job import Job, TaskRole
from openpaisdk.runtime import runtime_execute
from openpaisdk.utils import OrganizedList as ol


def pprint(s, fmt: str='yaml', **kwargs):
    if fmt == 'json':
        print(json.dumps(s, indent=4, **kwargs))
    if fmt == 'yaml':
        print(yaml.dump(s, default_flow_style=False))


def extract_args(args: argparse.Namespace, ignore_list: list=["scene", "action"]):
    return {k: v for k, v in vars(args).items() if k not in ignore_list}


def submit_job(args, job_config: dict, client: ClusterClient=None):
    if client is None:
        client = get_client(args.cluster_alias)
    envs, params = job_config.get("jobEnvs", {}), job_config.get("extras", {})
    code_dir = envs.get("PAI_SDK_JOB_CODE_DIR", None)
    if code_dir:
        for src in params.get("__sources__", []):
            Engine().process_args(Namespace().from_dict(args, scene="storage", action="upload", local_path=src, remote_path="%s/%s" % (code_dir, src), overwrite=True))
        src = Job.get_config_file(args)
        Engine().process_args(Namespace().from_dict(args, scene="storage", action="upload", local_path=src, remote_path="%s/%s" % (code_dir, os.path.basename(src)), overwrite=True))
    client.get_token().rest_api_submit(job_config)
    return client.get_job_link(args.job_name)


class ActionFactoryForDefault(ActionFactory):

    def define_arguments_set(self, parser: argparse.ArgumentParser):
        parser.add_argument('contents', nargs='*', help='(variable=value) pair to be set as default')

    def do_action_set(self, args):
        if not args.contents:
            return pai.__defaults__
        for kv in args.contents:
            key, value = kv.split('=')
            pai.__defaults__[key] = value
        to_file(pai.__defaults__, pai.__local_default_file__)
        return pai.__defaults__

    def define_arguments_unset(self, parser: argparse.ArgumentParser):
        parser.add_argument('variables', nargs='+', help='(variable=value) pair to be set as default')

    def do_action_unset(self, args):
        result = []
        for key in args.variables:
            if key not in pai.__defaults__:
                result.append("cannot unset default variable %s because it doesnot exist" % key)
                continue
            value = pai.__defaults__.pop(key, None)
            result.append("default variable {} (previously {}) deleted".format(key, value))
        to_file(pai.__defaults__, pai.__local_default_file__)
        return result


class ActionFactoryForCluster(ActionFactory):

    def define_arguments_list(self, parser):
        cli_add_arguments(None, parser, [])

    def do_action_list(self, args):
        return ol.as_dict(self.__clusters__.tell(), "cluster_alias")

    def define_arguments_add(self, parser: argparse.ArgumentParser):
        cli_add_arguments(self, parser, [
            '--cluster-alias', '--pai-uri', '--user', '--password',
        ])
    def check_arguments_add(self, args):
        if not args.pai_uri.startswith("http://") or not args.pai_uri.startswith("https://"):
            __logger__.warn("pai-uri not starts with http:// or https://")

    def do_action_add(self, args):
        return self.__clusters__.add(extract_args(args))

    def define_arguments_delete(self, parser: argparse.ArgumentParser):
        cli_add_arguments(None, parser, ['cluster_alias'])

    def do_action_delete(self, args):
        self.__clusters__.delete(args.cluster_alias)
        result = "cluster %s deleted" % args.cluster_alias
        return result

    def define_arguments_select(self, parser: argparse.ArgumentParser):
        cli_add_arguments(None, parser, ['cluster_alias'])

    def check_arguments_select(self, args):
        not_not(args, ['cluster_alias'])

    def do_action_select(self, args):
        return Engine().process(['set', 'cluster-alias=%s' % args.cluster_alias])

    def define_arguments_attach_hdfs(self, parser: argparse.ArgumentParser):
        cli_add_arguments(None, parser, ['--cluster-alias', '--default', '--storage-alias', '--web-hdfs-uri', '--user'])

    def check_arguments_attach_hdfs(self, args):
        not_not(args, ['--cluster-alias', '--storage-alias', '--web-hdfs-uri'])
        if not args.web_hdfs_uri.startswith("http://") or not args.web_hdfs_uri.startswith("https://"):
            __logger__.warn("web-hdfs-uri not starts with http:// or https://")

    def do_action_attach_hdfs(self, args):
        elem = {
            "storage_alias": args.storage_alias,
            "protocol": "webHDFS",
            "web_hdfs_uri": args.web_hdfs_uri,
            "user": args.user,
        }
        return self.__clusters__.attach_storage(args.cluster_alias, elem, as_default=args.default)


class ActionFactoryForJob(ActionFactory):

    # basic commands
    def define_arguments_list(self, parser: argparse.ArgumentParser):
        cli_add_arguments(None, parser, ['--cluster-alias'])
        parser.add_argument('job_name', metavar='job name', nargs='?')
        parser.add_argument('query', nargs='?', choices=['config', 'ssh'])

    def check_arguments_list(self, args):
        if args.query:
            assert args.job_name, "must specify a job name"

    def do_action_list(self, args):
        client = self.__clusters__.get_client(args.cluster_alias)
        jobs = client.rest_api_jobs(args.job_name, args.query)
        if not args.job_name:
            return ["%s [%s]" % (j["name"], j.get("state", "UNKNOWN")) for j in jobs]
        return jobs

    def define_arguments_submit(self, parser: argparse.ArgumentParser):
        cli_add_arguments(None, parser, ['--job-name', '--cluster-alias', '--v2', '--preview', 'config'])

    def check_arguments_submit(self, args):
        assert args.job_name or args.config, "please specify --job-name or give a job config file"

    def do_action_submit(self, args):
        if not args.config:
            args.config = Job.get_config_file(args.job_name, args.v2)
        self.__job__.load(fname=args.config)
        if args.preview:
            return self.__job__.validate().get_config()
        return self.__clusters__.submit(args.cluster_alias, self.__job__)

    def define_arguments_sub(self, parser: argparse.ArgumentParser):
        cli_add_arguments(None, parser, [
            '--job-name',
            '--cluster-alias',
            '--storage-alias', # use which storage for code transfer
            '--workspace',
            '--sources',
            '--image',
            '--disable-sdk-install',
            '--cpu', '--gpu', '--memoryMB',
            '--v2', '--preview', '--pip-flags',
            'commands'
        ])

    def do_action_sub(self, args):
        self.__job__.new(args.job_name).one_liner(**extract_args(args))
        if args.preview:
            return self.__job__.validate().get_config()
        return self.__clusters__.submit(args.cluster_alias, self.__job__)



class ActionFactoryForTaskRole(ActionFactory):

    def define_arguments_add(self, parser: argparse.ArgumentParser):
        TaskRole().define(parser)

    def do_action_add(self, args):
        elems = [x for x in self.__job__.taskroles if x.task_role_name == args.task_role_name]
        if len(elems):
            if not args.update:
                raise Exception("task role already exists", args.task_role_name)
            else:
                assert len(elems) == 1, ("why found too many task roles", self.__job__)
                elem = elems[0]
        else:
            self.__job__.taskroles.append(TaskRole())
            elem = self.__job__.taskroles[-1]
        elem.from_dict(vars(args), ignore_unkown=True)
        return elem.to_dict()


class ActionFactoryForRequirement(ActionFactory):

    def do_action_common(self, args: argparse.Namespace, r_type: req.Requirement):
        dic = dict(r_type().from_dict(vars(args), ignore_unkown=True).to_dict())
        self.__job__.requirements.append(dic)
        return dic

    def define_arguments_pip(self, parser: argparse.ArgumentParser):
        req.PipRequirement().define(parser)

    def do_action_pip(self, args):
        return self.do_action_common(args, req.PipRequirement)

    def define_arguments_weblink(self, parser: argparse.ArgumentParser):
        req.WebLinkRequirement().define(parser)

    def do_action_weblink(self, args):
        return self.do_action_common(args, req.WebLinkRequirement)


class ActionFactoryForRuntime(ActionFactory):

    def define_arguments_execute(self, parser: argparse.ArgumentParser):
        cli_add_arguments(None, parser, ['--working-dir', 'config'])

    def do_action_execute(self, args):
        return runtime_execute(args.config, args.working_dir)


class ActionFactoryForStorage(ActionFactory):

    def define_arguments_list_storage(self, parser: argparse.ArgumentParser):
        cli_add_arguments(None, parser, ['--cluster-alias'])

    def do_action_list_storage(self, args):
        client = get_client(args.cluster_alias)
        return ol.as_dict(client.config['storages'], 'storage_alias')

    def define_arguments_list(self, parser: argparse.ArgumentParser):
        cli_add_arguments(None, parser, ['--cluster-alias', '--storage-alias', 'remote_path'])

    def do_action_list(self, args):
        return get_storage(args).list(args.remote_path)

    def define_arguments_status(self, parser: argparse.ArgumentParser):
        cli_add_arguments(None, parser, ['--cluster-alias', '--storage-alias', 'remote_path'])

    def do_action_status(self, args):
        return get_storage(args).status(args.remote_path)

    def define_arguments_delete(self, parser: argparse.ArgumentParser):
        cli_add_arguments(None, parser, ['--cluster-alias', '--storage-alias', '--recursive', 'remote_path'])

    def do_action_delete(self, args):
        return get_storage(args).delete(args.remote_path, recursive=args.recursive)

    def define_arguments_download(self, parser: argparse.ArgumentParser):
        cli_add_arguments(None, parser, ['--cluster-alias', '--storage-alias', 'remote_path', 'local_path'])

    def do_action_download(self, args):
        return get_storage(args).download(remote_path=args.remote_path, local_path=args.remote_path)

    def define_arguments_upload(self, parser: argparse.ArgumentParser):
        cli_add_arguments(None, parser, ['--cluster-alias', '--storage-alias', '--overwrite', 'local_path', 'remote_path'])

    def do_action_upload(self, args):
        return get_storage(args).upload(remote_path=args.remote_path, local_path=args.local_path, overwrite=getattr(args, "overwrite", False))


def is_beta_version():
    return not pai.__sdk_branch__.startswith("sdk-release-")


__cli_structure__ = {
    "cluster": {
        "help": "cluster management",
        "factory": ActionFactoryForCluster,
        "actions": {
            "list": "list clusters in config file %s" % pai.__cluster_config_file__,
            "add": "add a cluster to config file %s" % pai.__cluster_config_file__,
            "delete": "delete a cluster from config file %s" % pai.__cluster_config_file__,
            "select": "select a cluster as default",
            "attach-hdfs": "attach hdfs storage to cluster",
        }
    },
    "job": {
        "help": "job operations",
        "factory": ActionFactoryForJob,
        "actions": {
            "list": "list existing jobs",
            "new": "create a job config cache for submitting",
            "preview": "preview job config",
            "submit": "submit the job from a config file",
            "sub": "shortcut of submitting a job in one line",
        }
    },
    "task": {
        "help": "configure task role",
        "factory": ActionFactoryForTaskRole,
        "actions": {
            "add": "add a task role",
        }
    },
    "require": {
        "help": "",
        "factory": ActionFactoryForRequirement,
        "actions":{
            "pip": "add pip dependencies",
            "weblink": "download weblink to folder"
        }
    },
    "storage": {
        "help": "storage operations",
        "factory": ActionFactoryForStorage,
        "actions": {
            "list-storage": "list storage attached to the cluster",
            "list": "list items about the remote path",
            "status": "get detailed information about remote path",
            "upload": "upload",
            "download": "download",
            "delete": "delete",
        }
    },
    "runtime": {
        "help": "runtime support",
        "factory": ActionFactoryForRuntime,
        "actions":{
            "execute": "execute user commands"
        }
    },
}


def generate_cli_structure(is_beta: bool):
    release_cli = {
        "cluster": [],
        "job": ["list", "submit", "sub"],
        "storage": [],
        "runtime": [],
    }
    if is_beta:
        cli_s = {key: deepcopy(__cli_structure__[key]) for key in release_cli.keys()}
        for key, value in cli_s.items():
            if not release_cli[key]:
                continue
            value["actions"] = {a: value["actions"][a] for a in release_cli[key]}
    else:
        cli_s = deepcopy(__cli_structure__)
    dic = {
        key: [
            value["help"],
            [value["factory"](x, value["actions"]) for x in value["actions"].keys()]
        ] for key, value in cli_s.items()
    }
    dic.update({
        "set": [
            "set a (default) variable for cluster and job", [ActionFactoryForDefault("set", {"set": ["set"]})]
        ],
        "unset": [
            "un-set a (default) variable for cluster and job", [ActionFactoryForDefault("unset", {"unset": ["unset"]})]
        ],
    })
    return dic


class Engine(EngineFactory):

    def __init__(self):
        super().__init__(generate_cli_structure(is_beta=False))


class EngineRelease(EngineFactory):

    def __init__(self):
        super().__init__(generate_cli_structure(is_beta=True))


def main():
    try:
        eng = EngineRelease()
        result = eng.process(sys.argv[1:])
        if result:
            pprint(result)
        return 0
    except AssertionError as identifier:
        print(identifier)
        __logger__.exception("Value error")
        return 1
    except Exception as identifier:
        print(identifier)
        __logger__.exception("Error")
        return 2
    else:
        return -1


if __name__ == '__main__':
    main()
