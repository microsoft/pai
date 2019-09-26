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


import argparse
import os
import sys
from openpaisdk.cli_arguments import cli_add_arguments
from openpaisdk.cli_factory import ActionFactory, EngineFactory
from openpaisdk.defaults import get_defaults, update_default
from openpaisdk.io_utils import browser_open, to_screen
from openpaisdk.utils import Nested, run_command, na, randstr
from openpaisdk.defaults import __flags__


def extract_args(args: argparse.Namespace, get_list: list = None, ignore_list: list = ["scene", "action"]):
    if get_list:
        return {k: getattr(args, k) for k in get_list}
    return {k: v for k, v in vars(args).items() if k not in ignore_list}


class ActionFactoryForDefault(ActionFactory):

    def define_arguments(self, parser: argparse.ArgumentParser):
        cli_add_arguments(parser, ['--is-global'])
        parser.add_argument('contents', nargs='*', help='(variable=value) pair to be set as default')

    def do_action_set(self, args):
        import re
        if not args.contents:
            return get_defaults(False, True, False) if args.is_global else get_defaults(True, True, False)
        kv_pairs = []
        for content in args.contents:
            m = re.match("^([^=]+?)([\+|\-]*=)([^=]*)$", content)
            if m:
                kv_pairs.append(m.groups())
            else:
                kv_pairs.append((content, '', ''))
        for kv_pair in kv_pairs:
            assert kv_pair[0] and kv_pair[1] in ["=", "+=", "-="] and kv_pair[2], \
                f"must specify a key=value pair ({kv_pair[0]}, {kv_pair[2]})"
            update_default(kv_pair[0], kv_pair[2], is_global=args.is_global)

    def do_action_unset(self, args):
        for kv_pair in args.contents:
            update_default(kv_pair[0], kv_pair[2], is_global=args.is_global, to_delete=True)


class ActionFactoryForCluster(ActionFactory):

    def define_arguments_edit(self, parser):
        cli_add_arguments(parser, ["--editor"])

    def check_arguments_edit(self, args):
        assert args.editor, "cannot edit the file without an editor"

    def do_action_edit(self, args):
        run_command([args.editor, cluster_cfg_file])

    def define_arguments_update(self, parser):
        pass

    def do_action_update(self, args):
        self.enable_svaing["clusters"] = True
        return self.__clusters__.update_all()

    def define_arguments_list(self, parser):
        cli_add_arguments(parser, [])

    @staticmethod
    def tabulate_resources(dic: dict):
        to_screen([
            [c, i.get("uri", None), i.get("user", None), v, i["GPUs"], i["vCores"], i["memory"]] for c in dic.keys() for v, i in dic[c].items()
        ], _type="table", headers=["cluster", "uri", "user", "virtual-cluster", "GPUs", "vCores", "memory"])
        return dic

    def do_action_list(self, args):
        info = self.__clusters__.tell()
        ActionFactoryForCluster.tabulate_resources(info)

    def define_arguments_resources(self, parser: argparse.ArgumentParser):
        cli_add_arguments(parser, [])

    def do_action_resources(self, args):
        r = self.__clusters__.available_resources()
        ActionFactoryForCluster.tabulate_resources(r)

    def define_arguments_add(self, parser: argparse.ArgumentParser):
        cli_add_arguments(
            parser, ['--cluster-alias', '--pai-uri', '--user', '--password', '--authen-token'])

    def check_arguments_add(self, args):
        assert args.cluster_alias or args.pai_uri or args.user, "must specify cluster-alias, pai-uri, user"
        assert args.password or args.token, "please add an authentication credential, password or token"

    def do_action_add(self, args):
        self.enable_svaing["clusters"] = True
        self.__clusters__.add(extract_args(args))

    def define_arguments_delete(self, parser: argparse.ArgumentParser):
        cli_add_arguments(parser, ['cluster_alias'])

    def do_action_delete(self, args):
        if self.__clusters__.delete(args.cluster_alias):
            to_screen("cluster %s deleted" % args.cluster_alias)
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
            '--image', '--cpu', '--gpu', '--mem', "--memoryMB",
            '--preview', '--no-browser',
            '--python',
        ])

    def check_essentials(self, args):
        assert args.cluster_alias, "must specify a cluster"
        args.sources = [] if not args.sources else args.sources
        args.pip_installs = [] if not args.pip_installs else args.pip_installs
        if args.sources:
            assert args.workspace, "must specify --workspace if --sources used"
            for s in args.sources:
                assert os.path.isfile(s), "file %s not found" % s
        assert args.image, "must specify a docker image"
        if args.job_name:
            args.job_name = args.job_name.replace("$", randstr(10))

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
            resources=extract_args(args, ["gpu", "cpu", "memoryMB", "mem"]),
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
            to_screen("no authentication token is set", _type="warn")

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
            resources=extract_args(args, ["gpu", "cpu", "memoryMB", "mem"]),
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
        return self.__clusters__.select(args.cluster_alias)['storages']

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


cluster_cfg_file = __flags__.get_cluster_cfg_file(get_defaults()["clusters-in-local"])


def generate_cli_structure(is_beta: bool):
    cli_s = {
        "cluster": {
            "help": "cluster management",
            "factory": ActionFactoryForCluster,
            "actions": {
                "list": "list clusters in config file %s" % cluster_cfg_file,
                "resources": "report the (available, used, total) resources of the cluster",
                "update": "check the healthness of clusters and update the information",
                "edit": "edit the config file in your editor %s" % cluster_cfg_file,
                "add": "add a cluster to config file %s" % cluster_cfg_file,
                "delete": "delete a cluster from config file %s" % cluster_cfg_file,
                "select": "select a cluster as default",
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
            to_screen(result)
        return 0
    except AssertionError as identifier:
        to_screen(f"Value error: {repr(identifier)}", _type="error")
        return 1
    except Exception as identifier:
        to_screen(f"Error: {repr(identifier)}", _type="error")
        return 2
    else:
        return -1


if __name__ == '__main__':
    main()
