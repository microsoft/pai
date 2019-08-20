import argparse
import os
import sys
from copy import deepcopy
from openpaisdk import __logger__, __cluster_config_file__
from openpaisdk.cli_arguments import cli_add_arguments, append_options_to_list
from openpaisdk.cli_factory import Action, ActionFactory, EngineFactory, Scene
from openpaisdk.core import pprint
from openpaisdk.defaults import read_defaults, update_default
from openpaisdk.io_utils import browser_open, to_screen
from openpaisdk.utils import OrganizedList as ol
from openpaisdk.utils import Nested, run_command, na
from uuid import uuid4 as randstr


def extract_args(args: argparse.Namespace, get_list: list = None, ignore_list: list = ["scene", "action"]):
    if get_list:
        return {k: getattr(args, k) for k in get_list}
    return {k: v for k, v in vars(args).items() if k not in ignore_list}


class ActionFactoryForDefault(ActionFactory):

    def define_arguments_set(self, parser: argparse.ArgumentParser):
        cli_add_arguments(parser, ['--is-global'])
        parser.add_argument('contents', nargs='*',
                            help='(variable=value) pair to be set as default')

    def do_action_set(self, args):
        if not args.contents:
            return read_defaults(global_only=args.is_global)
        for kv in args.contents:
            key, value = kv.split('=')
            assert key is not None and value is not None, "must specify a key=value pair"
            update_default(key, value, is_global=args.is_global)

    def define_arguments_unset(self, parser: argparse.ArgumentParser):
        cli_add_arguments(parser, ['--is-global'])
        parser.add_argument('variables', nargs='+',
                            help='(variable=value) pair to be set as default')

    def do_action_unset(self, args):
        for key in args.variables:
            update_default(key, is_global=args.is_global, to_delete=True)


class ActionFactoryForCluster(ActionFactory):

    def define_arguments_edit(self, parser):
        cli_add_arguments(parser, ["--editor"])

    def check_arguments_edit(self, args):
        assert args.editor, "cannot edit the file without an editor"

    def do_action_edit(self, args):
        run_command([args.editor, __cluster_config_file__])
        self.disable_saving["clusters"] = True

    def define_arguments_list(self, parser):
        cli_add_arguments(parser, [])

    def do_action_list(self, args):
        info = self.__clusters__.tell()
        to_screen([
            [c, v, i["GPUs"], i["vCores"], i["memory"]] for c in info.keys() for v, i in info[c].items()
        ], is_table=True, headers=["cluster", "virtual-cluster", "GPUs", "vCores", "memory"])

    def define_arguments_resources(self, parser: argparse.ArgumentParser):
        cli_add_arguments(parser, [])

    def do_action_resources(self, args):
        return self.__clusters__.available_resources()

    def define_arguments_add(self, parser: argparse.ArgumentParser):
        cli_add_arguments(
            parser, ['--cluster-alias', '--pai-uri', '--user', '--password', '--authen-token'])

    def check_arguments_add(self, args):
        assert args.cluster_alias or args.pai_uri or args.user, "must specify cluster-alias, pai-uri, user"
        assert args.password or args.token, "please add an authentication credential, password or token"

    def do_action_add(self, args):
        return self.__clusters__.add(extract_args(args))

    def define_arguments_delete(self, parser: argparse.ArgumentParser):
        cli_add_arguments(parser, ['cluster_alias'])

    def do_action_delete(self, args):
        if self.__clusters__.delete(args.cluster_alias):
            __logger__.info("cluster %s deleted" % args.cluster_alias)
        return None

    def define_arguments_select(self, parser: argparse.ArgumentParser):
        cli_add_arguments(parser, ['--is-global', 'cluster_alias'])

    def check_arguments_select(self, args):
        assert args.cluster_alias, "must specify a valid cluster-alias"

    def do_action_select(self, args):
        update_default('cluster-alias', args.cluster_alias,
                       is_global=args.is_global)


class ActionFactoryForJob(ActionFactory):

    # basic commands
    def define_arguments_list(self, parser: argparse.ArgumentParser):
        cli_add_arguments(parser, ['--cluster-alias', '--user'])

    def do_action_list(self, args):
        client = self.__clusters__.get_client(args.cluster_alias)
        if not args.user:
            args.user = client.user
            to_screen("if not set, only your job will be listed, user `--user __all__` to list jobs of all users")
        if args.user == '__all__':
            args.user = None
        jobs = client.rest_api_job_list(user=args.user)
        return ["%s [%s]" % (j["name"], j.get("state", "UNKNOWN")) for j in jobs]

    def define_arguments_status(self, parser: argparse.ArgumentParser):
        cli_add_arguments(parser, ['--cluster-alias', '--user'])
        parser.add_argument('job_name', help='job name')
        parser.add_argument('query', nargs='?', choices=['config', 'ssh'])

    def check_arguments_status(self, args):
        assert args.job_name, "must specify a job name"

    def do_action_status(self, args):
        client = self.__clusters__.get_client(args.cluster_alias)
        if not args.user:
            args.user = client.user
        return client.rest_api_job_info(args.job_name, args.query, user=args.user)

    def define_arguments_stop(self, parser: argparse.ArgumentParser):
        cli_add_arguments(parser, ['--cluster-alias'])
        parser.add_argument('job_names', nargs='+', help='job name')

    def check_arguments_stop(self, args):
        assert args.job_names, "must specify a job name"

    def do_action_stop(self, args):
        client = self.__clusters__.get_client(args.cluster_alias)
        for job_name in args.job_names:
            to_screen(client.rest_api_execute_job(job_name, "STOP"))

    def define_arguments_submit(self, parser: argparse.ArgumentParser):
        cli_add_arguments(
            parser, ['--cluster-alias', '--virtual-cluster', '--preview', '--update', 'config'])

    def check_arguments_submit(self, args):
        assert args.config, "please specify a job config file (json or yaml format)"
        assert os.path.isfile(args.config), "%s cannot be read" % args.config

    def submit_it(self, args):
        if args.preview:
            return self.__job__.validate().get_config()
        result = self.__job__.submit(args.cluster_alias, args.virtual_cluster)
        if "job_link" in result and not getattr(args, 'no_browser', False):
            browser_open(result["job_link"])
        return result

    def do_action_submit(self, args):
        # key-value pair in --update option would support nested key, e.g. defaults->virtualCluster=<your-virtual-cluster>
        self.__job__.load(fname=args.config)
        if args.update:
            for s in args.update:
                key, value = s.split("=")
                Nested(self.__job__.protocol).set(key, value)
        return self.submit_it(args)

    def define_essentials(self, parser: argparse.ArgumentParser):
        cli_add_arguments(parser, [
            '--job-name',
            '--cluster-alias', '--virtual-cluster', '--workspace',  # for cluster
            '--sources', '--pip-installs',  # for sdk_template
            '--image', '--cpu', '--gpu', '--memoryMB',
            '--preview', '--no-browser',
            '--python',
        ])

    def check_essentials(self, args):
        args.sources = [] if not args.sources else args.sources
        args.pip_installs = [] if not args.pip_installs else args.pip_installs
        if args.sources:
            assert args.workspace, "must specify --workspace if --sources used"
            for s in args.sources:
                assert os.path.isfile(s), "file %s not found" % s
        assert args.image, "must specify a docker image"
        if args.job_name:
            args.job_name = args.job_name.replace("$", randstr().hex)

    def define_arguments_sub(self, parser: argparse.ArgumentParser):
        self.define_essentials(parser)
        cli_add_arguments(parser, [
            'commands'
        ])

    def check_arguments_sub(self, args):
        self.check_essentials(args)

    def do_action_sub(self, args):
        self.__job__.new(args.job_name).one_liner(
            commands=" ".join(args.commands),
            image=args.image,
            resources=extract_args(args, ["gpu", "cpu", "memoryMB"]),
            cluster=extract_args(
                args, ["cluster_alias", "virtual_cluster", "workspace"]),
            sources=args.sources, pip_installs=args.pip_installs,
        )
        self.__job__.protocol["parameters"]["python_path"] = args.python
        return self.submit_it(args)

    def define_arguments_notebook(self, parser: argparse.ArgumentParser):
        self.define_essentials(parser)
        cli_add_arguments(parser, [
            '--interactive',
            '--notebook-token',
            'notebook'
        ])

    def check_arguments_notebook(self, args):
        self.check_essentials(args)
        assert args.notebook or args.interactive, "must specify a notebook name unless in interactive mode"
        if not args.job_name:
            assert args.notebook or args.interactive, "must specify a notebook if no job name defined"
            args.job_name = os.path.splitext(os.path.basename(args.notebook))[
                0] + "_" + randstr().hex if args.notebook else "jupyter_server_{}".format(randstr().hex)
        if args.interactive and not args.token:
            __logger__.warn("no authentication token is set")

    def connect_notebook(self):
        result = self.__job__.wait()
        if result.get("notebook", None) is not None:
            browser_open(result["notebook"])
        return result

    def do_action_notebook(self, args):
        self.__job__.new(args.job_name).from_notebook(
            nb_file=args.notebook, mode="interactive" if args.interactive else "silent", token=args.token,
            image=args.image,
            cluster=extract_args(
                args, ["cluster_alias", "virtual_cluster", "workspace"]),
            resources=extract_args(args, ["gpu", "cpu", "memoryMB"]),
            sources=args.sources, pip_installs=args.pip_installs,
        )
        self.__job__.protocol["parameters"]["python_path"] = args.python
        result = self.submit_it(args)
        if not args.preview:
            result.update(na(self.connect_notebook(), {}))
        return result

    def define_arguments_connect(self, parser: argparse.ArgumentParser):
        cli_add_arguments(parser, ['--cluster-alias'])
        parser.add_argument('job_name', help="job name to connect")

    def check_arguments_connect(self, args):
        assert args.cluster_alias, "must specify a cluster"
        assert args.job_name, "must specify a job name"

    def do_action_connect(self, args):
        to_screen("retrieving job config from cluster")
        self.__job__.load(job_name=args.job_name, cluster_alias=args.cluster_alias)
        return self.connect_notebook()


class ActionFactoryForStorage(ActionFactory):

    def define_arguments_list_storage(self, parser: argparse.ArgumentParser):
        cli_add_arguments(parser, ['--cluster-alias'])

    def do_action_list_storage(self, args):
        return ol.as_dict(self.__clusters__.select(args.cluster_alias)['storages'], 'storage_alias')

    def define_arguments_list(self, parser: argparse.ArgumentParser):
        cli_add_arguments(
            parser, ['--cluster-alias', '--storage-alias', 'remote_path'])

    def do_action_list(self, args):
        return self.__clusters__.get_client(args.cluster_alias).get_storage(args.storage_alias).list(args.remote_path)

    def define_arguments_status(self, parser: argparse.ArgumentParser):
        cli_add_arguments(
            parser, ['--cluster-alias', '--storage-alias', 'remote_path'])

    def do_action_status(self, args):
        return self.__clusters__.get_client(args.cluster_alias).get_storage(args.storage_alias).status(args.remote_path)

    def define_arguments_delete(self, parser: argparse.ArgumentParser):
        cli_add_arguments(
            parser, ['--cluster-alias', '--storage-alias', '--recursive', 'remote_path'])

    def do_action_delete(self, args):
        return self.__clusters__.get_client(args.cluster_alias).get_storage(args.storage_alias).delete(args.remote_path, recursive=args.recursive)

    def define_arguments_download(self, parser: argparse.ArgumentParser):
        cli_add_arguments(
            parser, ['--cluster-alias', '--storage-alias', 'remote_path', 'local_path'])

    def do_action_download(self, args):
        return self.__clusters__.get_client(args.cluster_alias).get_storage(args.storage_alias).download(remote_path=args.remote_path, local_path=args.local_path)

    def define_arguments_upload(self, parser: argparse.ArgumentParser):
        cli_add_arguments(parser, [
                          '--cluster-alias', '--storage-alias', '--overwrite', 'local_path', 'remote_path'])

    def do_action_upload(self, args):
        return self.__clusters__.get_client(args.cluster_alias).get_storage(args.storage_alias).upload(remote_path=args.remote_path, local_path=args.local_path, overwrite=getattr(args, "overwrite", False))


__cli_structure__ = {
    "cluster": {
        "help": "cluster management",
        "factory": ActionFactoryForCluster,
        "actions": {
            "list": "list clusters in config file %s" % __cluster_config_file__,
            "resources": "report the (available, used, total) resources of the cluster",
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
            "status": "query the status of a job",
            "stop": "stop the job",
            "submit": "submit the job from a config file",
            "sub": "generate a config file from commands, and then `submit` it",
            "notebook": "run a jupyter notebook remotely",
            "connect": "connect to an existing job",
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
            [value["factory"](x, value["actions"])
             for x in value["actions"].keys()]
        ] for key, value in cli_s.items()
    }
    dic.update({
        "set": [
            "set a (default) variable for cluster and job", [
                ActionFactoryForDefault("set", {"set": ["set"]})]
        ],
        "unset": [
            "un-set a (default) variable for cluster and job", [
                ActionFactoryForDefault("unset", {"unset": ["unset"]})]
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
