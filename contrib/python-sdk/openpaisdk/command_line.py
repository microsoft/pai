import argparse
import os
import sys
from copy import deepcopy
from openpaisdk import __logger__, __cluster_config_file__, __local_default_file__
from openpaisdk.cli_arguments import cli_add_arguments, append_options_to_list
from openpaisdk.cli_factory import Action, ActionFactory, EngineFactory, Scene
from openpaisdk.core import pprint
from openpaisdk.io_utils import from_file, to_file, get_defaults
from openpaisdk.utils import OrganizedList as ol
from openpaisdk.utils import Nested, run_command
from uuid import uuid4 as randstr


def extract_args(args: argparse.Namespace, ignore_list: list=["scene", "action"], get_list: list=[]):
    if get_list:
        return {k: getattr(args, k) for k in get_list}
    return {k: v for k, v in vars(args).items() if k not in ignore_list}


class ActionFactoryForDefault(ActionFactory):

    def define_arguments_set(self, parser: argparse.ArgumentParser):
        parser.add_argument('contents', nargs='*', help='(variable=value) pair to be set as default')

    def do_action_set(self, args):
        defaults = get_defaults()
        if not args.contents:
            return defaults
        for kv in args.contents:
            key, value = kv.split('=')
            assert key is not None and value is not None, "must specify a key=value pair"
            defaults[key] = value
        to_file(defaults, __local_default_file__)
        return defaults

    def define_arguments_unset(self, parser: argparse.ArgumentParser):
        parser.add_argument('variables', nargs='+', help='(variable=value) pair to be set as default')

    def do_action_unset(self, args):
        result = []
        defaults = get_defaults()
        for key in args.variables:
            if key not in defaults:
                result.append("cannot unset default variable %s because it doesn't exist" % key)
                continue
            value = defaults.pop(key, None)
            result.append("default variable {} (previously {}) deleted".format(key, value))
        to_file(defaults, __local_default_file__)
        return result


class ActionFactoryForCluster(ActionFactory):

    def define_arguments_edit(self, parser):
        cli_add_arguments(parser, ["--editor"])

    def check_arguments_edit(self, args):
        assert args.editor, "cannot edit the file without an editor"

    def do_action_edit(self, args):
        run_command([args.editor, __cluster_config_file__])

    def define_arguments_list(self, parser):
        cli_add_arguments(parser, [])

    def do_action_list(self, args):
        return ol.as_dict(self.__clusters__.tell(), "cluster_alias")

    def define_arguments_add(self, parser: argparse.ArgumentParser):
        cli_add_arguments(parser, ['--cluster-alias', '--pai-uri', '--user', '--password'])

    def check_arguments_add(self, args):
        if not args.pai_uri.startswith("http://") or not args.pai_uri.startswith("https://"):
            __logger__.warn("pai-uri not starts with http:// or https://")
        assert args.user and args.cluster_alias, "must specify an cluster-alias and user name"

    def do_action_add(self, args):
        return self.__clusters__.add(extract_args(args))

    def define_arguments_delete(self, parser: argparse.ArgumentParser):
        cli_add_arguments(parser, ['cluster_alias'])

    def do_action_delete(self, args):
        if self.__clusters__.delete(args.cluster_alias):
            __logger__.info("cluster %s deleted" % args.cluster_alias)
        return None

    def define_arguments_select(self, parser: argparse.ArgumentParser):
        cli_add_arguments(parser, ['cluster_alias'])

    def check_arguments_select(self, args):
        assert args.cluster_alias, "must specify a valid cluster-alias"

    def do_action_select(self, args):
        return Engine().process(['set', 'cluster-alias=%s' % args.cluster_alias])

    def define_arguments_attach_hdfs(self, parser: argparse.ArgumentParser):
        cli_add_arguments(parser, ['--cluster-alias', '--default', '--storage-alias', '--web-hdfs-uri', '--user'])

    def check_arguments_attach_hdfs(self, args):
        assert args.cluster_alias and args.storage_alias, "must specify valid cluster-alias and storage-alias"
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
        cli_add_arguments(parser, ['--cluster-alias', '--user'])
        parser.add_argument('job_name', metavar='job name', nargs='?')
        parser.add_argument('query', nargs='?', choices=['config', 'ssh'])

    def check_arguments_list(self, args):
        if args.query:
            assert args.job_name, "must specify a job name"

    def do_action_list(self, args):
        client = self.__clusters__.get_client(args.cluster_alias)
        jobs = client.rest_api_jobs(args.job_name, args.query, user=args.user)
        if not args.job_name:
            return ["%s [%s]" % (j["name"], j.get("state", "UNKNOWN")) for j in jobs]
        return jobs

    def define_arguments_submit(self, parser: argparse.ArgumentParser):
        cli_add_arguments(parser, ['--cluster-alias', '--preview', '--update', 'config'])

    def check_arguments_submit(self, args):
        assert args.config, "please specify a job config file (json or yaml format)"
        assert os.path.isfile(args.config), "%s cannot be read" % args.config

    def do_action_submit(self, args):
        # key-value pair in --update option would support nested key, e.g. defaults->virtualCluster=<your-virtual-cluster>
        self.__job__.load(fname=args.config)
        if args.update:
            for s in args.update:
                key, value = s.split("=")
                Nested(self.__job__.protocol).set(key, value)
        if args.preview:
            return self.__job__.validate().get_config()
        return self.__job__.submit(args.cluster_alias)

    def define_arguments_sub(self, parser: argparse.ArgumentParser):
        cli_add_arguments(parser, [
            '--job-name',
            '--cluster-alias',
            '--virtual-cluster',
            '--workspace', '--sources', '--python', '--pip-installs',
            '--image',
            '--cpu', '--gpu', '--memoryMB',
            '--preview',
            '--enable-sdk',
            '--cmd-sep',
            'commands'
        ])

    def check_arguments_sub(self, args):
        append_options_to_list(args, ["sources", "pip_installs"])
        if args.sources or args.pip_installs:
            if not args.enable_sdk:
                __logger__.warn("upload local file requires --enable-sdk, assert automatically")
                args.enable_sdk = True
        if args.sources:
            assert args.workspace, "must specify --workspace if --sources used"
            for s in args.sources:
                assert os.path.isfile(s), "file %s not found" % s

    def do_action_sub(self, args):
        self.__job__.new(args.job_name)
        if args.enable_sdk:
            self.__job__.deployment_for_sdk([args.cluster_alias], **extract_args(args, get_list=["workspace", "sources", "python", "pip_installs"]))
        return self.__job__.one_liner(
            commands = " ".join(args.commands).split(args.cmd_sep),
            image = args.image,
            resources=extract_args(args, get_list=["gpu", "cpu", "memoryMB"]),
            cluster=extract_args(args, get_list=["cluster_alias", "virtual_cluster", "workspace"]),
            sources=args.sources,
            submit = not args.preview, enable_sdk=args.enable_sdk
        )

    def define_arguments_notebook(self, parser: argparse.ArgumentParser):
        cli_add_arguments(parser, [
            '--job-name',
            '--cluster-alias',
            '--virtual-cluster',
            '--workspace', '--sources', '--python', '--pip-installs',
            '--image',
            '--cpu', '--gpu', '--memoryMB',
            '--preview',
            '--interactive',
            '--token',
            '--cmd-sep',
            'notebook'
        ])

    def check_arguments_notebook(self, args):
        append_options_to_list(args, ["sources", "pip_installs"])
        assert args.notebook or args.interactive, "must specify a notebook name unless in interactive mode"
        if not args.job_name:
            assert args.notebook or args.interactive, "must specify a notebook if no job name defined"
            args.job_name = os.path.splitext(os.path.basename(args.notebook))[0] + "_" + randstr().hex if args.notebook else "jupyter_server_{}".format(randstr().hex)
        if args.interactive and not args.token:
            __logger__.warn("no authentication token is set")
        args.pip_installs = args.pip_installs + ["jupyter"]
        args.sources = args.sources + [args.notebook]

    def do_action_notebook(self, args):
        self.__job__.new(args.job_name)
        if getattr(args, "enable_sdk", True):
            self.__job__.deployment_for_sdk([args.cluster_alias], **extract_args(args, get_list=["workspace", "sources", "python", "pip_installs"]))
        return self.__job__.from_notebook(
            nb_file = args.notebook,
            image = args.image,
            resources=extract_args(args, get_list=["gpu", "cpu", "memoryMB"]),
            cluster=extract_args(args, get_list=["cluster_alias", "virtual_cluster", "workspace"]),
            submit = not args.preview,
            interactive_mode=args.interactive, token=args.token,
        )


class ActionFactoryForStorage(ActionFactory):

    def define_arguments_list_storage(self, parser: argparse.ArgumentParser):
        cli_add_arguments(parser, ['--cluster-alias'])

    def do_action_list_storage(self, args):
        return ol.as_dict(self.__clusters__.select(args.cluster_alias)['storages'], 'storage_alias')

    def define_arguments_list(self, parser: argparse.ArgumentParser):
        cli_add_arguments(parser, ['--cluster-alias', '--storage-alias', 'remote_path'])

    def do_action_list(self, args):
        return self.__clusters__.get_client(args.cluster_alias).get_storage(args.storage_alias).list(args.remote_path)

    def define_arguments_status(self, parser: argparse.ArgumentParser):
        cli_add_arguments(parser, ['--cluster-alias', '--storage-alias', 'remote_path'])

    def do_action_status(self, args):
        return self.__clusters__.get_client(args.cluster_alias).get_storage(args.storage_alias).status(args.remote_path)

    def define_arguments_delete(self, parser: argparse.ArgumentParser):
        cli_add_arguments(parser, ['--cluster-alias', '--storage-alias', '--recursive', 'remote_path'])

    def do_action_delete(self, args):
        return self.__clusters__.get_client(args.cluster_alias).get_storage(args.storage_alias).delete(args.remote_path, recursive=args.recursive)

    def define_arguments_download(self, parser: argparse.ArgumentParser):
        cli_add_arguments(parser, ['--cluster-alias', '--storage-alias', 'remote_path', 'local_path'])

    def do_action_download(self, args):
        return self.__clusters__.get_client(args.cluster_alias).get_storage(args.storage_alias).download(remote_path=args.remote_path, local_path=args.local_path)

    def define_arguments_upload(self, parser: argparse.ArgumentParser):
        cli_add_arguments(parser, ['--cluster-alias', '--storage-alias', '--overwrite', 'local_path', 'remote_path'])

    def do_action_upload(self, args):
        return self.__clusters__.get_client(args.cluster_alias).get_storage(args.storage_alias).upload(remote_path=args.remote_path, local_path=args.local_path, overwrite=getattr(args, "overwrite", False))


__cli_structure__ = {
    "cluster": {
        "help": "cluster management",
        "factory": ActionFactoryForCluster,
        "actions": {
            "list": "list clusters in config file %s" % __cluster_config_file__,
            "edit": "edit the config file in your editor %s" % __cluster_config_file__,
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
            "notebook": "run a jupyter notebook remotely",
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
