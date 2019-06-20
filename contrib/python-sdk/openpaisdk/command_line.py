import argparse
import json
import os
import sys
from copy import deepcopy

import yaml

from openpaisdk import __logger__, __cluster_config_file__, __local_default_file__
from openpaisdk.cli_arguments import Namespace, cli_add_arguments, not_not
from openpaisdk.cli_factory import Action, ActionFactory, EngineFactory, Scene
from openpaisdk.core import ClusterClient
from openpaisdk.io_utils import from_file, to_file
from openpaisdk.job import Job, TaskRole
from openpaisdk.runtime import runtime_execute
from openpaisdk.utils import OrganizedList as ol
from openpaisdk.utils import Nested


def pprint(s, fmt: str='yaml', **kwargs):
    """the function to output structured strings as cli feedback"""
    if fmt == 'json':
        print(json.dumps(s, indent=4, **kwargs))
    if fmt == 'yaml':
        print(yaml.dump(s, default_flow_style=False))


def extract_args(args: argparse.Namespace, ignore_list: list=["scene", "action"]):
    return {k: v for k, v in vars(args).items() if k not in ignore_list}


class ActionFactoryForDefault(ActionFactory):

    def define_arguments_set(self, parser: argparse.ArgumentParser):
        parser.add_argument('contents', nargs='*', help='(variable=value) pair to be set as default')

    def do_action_set(self, args):
        __defaults__ = from_file(__local_default_file__, default={})
        if not args.contents:
            return __defaults__
        for kv in args.contents:
            key, value = kv.split('=')
            __defaults__[key] = value
        to_file(__defaults__, __local_default_file__)
        return __defaults__

    def define_arguments_unset(self, parser: argparse.ArgumentParser):
        parser.add_argument('variables', nargs='+', help='(variable=value) pair to be set as default')

    def do_action_unset(self, args):
        result = []
        __defaults__ = from_file(__local_default_file__, default={})
        for key in args.variables:
            if key not in __defaults__:
                result.append("cannot unset default variable %s because it doesn't exist" % key)
                continue
            value = __defaults__.pop(key, None)
            result.append("default variable {} (previously {}) deleted".format(key, value))
        to_file(__defaults__, __local_default_file__)
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
        cli_add_arguments(None, parser, ['--cluster-alias', '--v2', '--preview', '--update', 'config'])

    def check_arguments_submit(self, args):
        assert args.config, "please specify a job config file (json or yaml format)"

    def do_action_submit(self, args):
        # TODO key-value pair in --update option would support nested key, e.g. defaults->virtualCluster=<your-virtual-cluster>
        self.__job__.load(fname=args.config)
        if args.update:
            for s in args.update:
                key, value = s.split("=")
                Nested(self.__job__.protocol).set(key, value)
        if args.preview:
            return self.__job__.validate().get_config()
        return self.__clusters__.submit(args.cluster_alias, self.__job__)

    def define_arguments_sub(self, parser: argparse.ArgumentParser):
        cli_add_arguments(None, parser, [
            '--job-name',
            '--cluster-alias',
            '--virtual-cluster',
            '--image',
            '--cpu', '--gpu', '--memoryMB',
            '--preview',
            '--cmd-sep',
            'commands'
        ])

    def do_action_sub(self, args):
        cmds = " ".join(args.commands).split(args.cmd_sep)
        args.commands = cmds
        self.__job__.new(args.job_name).one_liner(**extract_args(args))
        if args.preview:
            return self.__job__.validate().get_config()
        return self.__clusters__.submit(args.cluster_alias, self.__job__)


class ActionFactoryForRuntime(ActionFactory):

    def define_arguments_execute(self, parser: argparse.ArgumentParser):
        cli_add_arguments(None, parser, ['--working-dir', 'config'])

    def do_action_execute(self, args):
        return runtime_execute(args.config, args.working_dir)


class ActionFactoryForStorage(ActionFactory):

    def define_arguments_list_storage(self, parser: argparse.ArgumentParser):
        cli_add_arguments(None, parser, ['--cluster-alias'])

    def do_action_list_storage(self, args):
        return ol.as_dict(self.__clusters__.select(args.cluster_alias)['storages'], 'storage_alias')

    def define_arguments_list(self, parser: argparse.ArgumentParser):
        cli_add_arguments(None, parser, ['--cluster-alias', '--storage-alias', 'remote_path'])

    def do_action_list(self, args):
        return self.__clusters__.get_client(args.cluster_alias).get_storage(args.storage_alias).list(args.remote_path)

    def define_arguments_status(self, parser: argparse.ArgumentParser):
        cli_add_arguments(None, parser, ['--cluster-alias', '--storage-alias', 'remote_path'])

    def do_action_status(self, args):
        return self.__clusters__.get_client(args.cluster_alias).get_storage(args.storage_alias).status(args.remote_path)

    def define_arguments_delete(self, parser: argparse.ArgumentParser):
        cli_add_arguments(None, parser, ['--cluster-alias', '--storage-alias', '--recursive', 'remote_path'])

    def do_action_delete(self, args):
        return self.__clusters__.get_client(args.cluster_alias).get_storage(args.storage_alias).delete(args.remote_path, recursive=args.recursive)

    def define_arguments_download(self, parser: argparse.ArgumentParser):
        cli_add_arguments(None, parser, ['--cluster-alias', '--storage-alias', 'remote_path', 'local_path'])

    def do_action_download(self, args):
        return self.__clusters__.get_client(args.cluster_alias).get_storage(args.storage_alias).download(remote_path=args.remote_path, local_path=args.remote_path)

    def define_arguments_upload(self, parser: argparse.ArgumentParser):
        cli_add_arguments(None, parser, ['--cluster-alias', '--storage-alias', '--overwrite', 'local_path', 'remote_path'])

    def do_action_upload(self, args):
        return self.__clusters__.get_client(args.cluster_alias).get_storage(args.storage_alias).upload(remote_path=args.remote_path, local_path=args.local_path, overwrite=getattr(args, "overwrite", False))


__cli_structure__ = {
    "cluster": {
        "help": "cluster management",
        "factory": ActionFactoryForCluster,
        "actions": {
            "list": "list clusters in config file %s" % __cluster_config_file__,
            "add": "add a cluster to config file %s" % __cluster_config_file__,
            "delete": "delete a cluster from config file %s" % __cluster_config_file__,
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


def main():
    try:
        eng = Engine()
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
