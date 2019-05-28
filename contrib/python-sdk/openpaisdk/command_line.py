import argparse
import json, yaml
import os, sys
import openpaisdk as pai
from openpaisdk import __logger__
from openpaisdk.io_utils import from_file, to_file
from openpaisdk.utils import list2dict
from openpaisdk.core import Cluster
from openpaisdk.job import TaskRole, JobSpec, Job
import openpaisdk.runtime_requires as req
from openpaisdk.runtime import runtime_execute
from openpaisdk.cli_arguments import Namespace, cli_add_arguments
from openpaisdk.cli_factory import EngineFactory, ActionFactory, Scene, Action


def pprint(s, fmt: str='yaml', **kwargs):
    if fmt == 'json':
        print(json.dumps(s, indent=4, **kwargs))
    if fmt == 'yaml':
        print(yaml.dump(s, default_flow_style=False))


def get_client_cfg(alias, mask_passwd: bool=False):
    cfgs = from_file(pai.__cluster_config_file__, default=[])
    if mask_passwd:
        for c in cfgs:
            c["passwd"] = "******"
    f = [(c,i) for i, c in enumerate(cfgs) if not alias or c['cluster_alias'] == alias]
    return {
        "all": cfgs,
        "match": f[0][0] if f else None,
        "index": f[0][1] if f else -1,
    }


def get_client(alias):
    try:
        cfg = get_client_cfg(alias)["match"]
        return Cluster(**cfg)
    except:
        __logger__.error('Cannot find cluster named %s', alias, exc_info=1)


def get_storage(args):
    client = get_client(args.cluster_alias)
    s_a = getattr(args, 'storage_alias', None)
    if s_a is None:
        return client.storage
    else:
        return client.storages[s_a]


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
        cli_add_arguments(None, parser, ['--cluster-alias', '--name'])

    def do_action_list(self, args):
        cfgs = list2dict(get_client_cfg(None, True)["all"], "cluster_alias")
        if args.name:
            return list(cfgs.keys())
        return cfgs

    def define_arguments_add(self, parser: argparse.ArgumentParser):
        Cluster().define(parser)

    def do_action_add(self, args):
        f = get_client_cfg(args.cluster_alias)
        cfgs, idx = f["all"], f["index"]
        cfg_new = Cluster(**{k: getattr(args, k, None) for k in 'pai_uri cluster_alias user passwd'.split()}).config
        __logger__.debug('new cluster info is %s', cfg_new)
        result = []
        if idx == -1:
            cfgs.append(cfg_new)
            result.append('cluster %s added to %s' % (args.cluster_alias, pai.__cluster_config_file__))
        else:
            result.append('cluster %s already exists in %s, overwrite its config' % (args.cluster_alias, pai.__cluster_config_file__))
            cfgs[idx] = cfg_new
        to_file(cfgs, pai.__cluster_config_file__)
        return result

    def define_arguments_select(self, parser: argparse.ArgumentParser):
        cli_add_arguments(None, parser, ['cluster_alias'])

    def do_action_select(self, args):
        return Engine().process(['set', 'cluster-alias=%s' % args.cluster_alias])

    def define_arguments_attach_hdfs(self, parser: argparse.ArgumentParser):
        cli_add_arguments(None, parser, ['--cluster-alias', '--storage-alias', '--web-hdfs-uri', '--user'])

    def do_action_attach_hdfs(self, args):
        f = get_client_cfg(args.cluster_alias)
        f["match"].setdefault('storages', []).append({
            "storage_alias": args.storage_alias,
            "protocol": "webHDFS",
            "web_hdfs_uri": args.web_hdfs_uri,
            "user": args.user if args.user else c['user'],
        })
        to_file(f["all"], pai.__cluster_config_file__)
        return "storage %s added to cluster %s" % (args.storage_alias, args.cluster_alias)


class ActionFactoryForJob(ActionFactory):

    # basic commands
    def define_arguments_list(self, parser: argparse.ArgumentParser):
        cli_add_arguments(None, parser, ['--cluster-alias', '--name'])
        parser.add_argument('job_name', metavar='job name', nargs='?')
        parser.add_argument('query', nargs='?', choices=['config', 'ssh'])

    def do_action_list(self, args):
        client = get_client(args.cluster_alias)
        result = client.rest_api_jobs(args.job_name, args.query)
        if args.name:
            assert not args.query, 'cannot use --name with query at the same time'
            result = list2dict(result, 'name')
        return result

    def define_arguments_submit(self, parser: argparse.ArgumentParser):
        cli_add_arguments(None, parser, ['--job-name', '--cluster-alias', '--v2', '--rename', 'config'])

    def do_action_submit(self, args):
        if not getattr(args, 'config', None):
            args.config = Job.job_cache_file(args.job_name, Job.default_job_config_filename("2" if args.v2 else "1"))
        job_config = from_file(args.config)
        if getattr(args, 'rename', True):
            job_config["name"] = args.job_name
        if not getattr(args, "job_name", None) in [None, "null"]:
            args.job_name = job_config["name"]
        assert args.job_name == job_config["name"], "job name mismatch %s <> %s" % (args.job_name, job_config["name"])
        # save the job_config to cache folder
        if args.config != Job.job_cache_file(args.job_name, Job.default_job_config_filename("2" if args.v2 else "1")):
            to_file(job_config, Job.job_cache_file(args.job_name, Job.default_job_config_filename("2" if args.v2 else "1")))

        client = get_client(args.cluster_alias)
        client.get_token().rest_api_submit(job_config, use_v2=args.v2)
        return client.get_job_link(args.job_name)

    def define_arguments_new(self, parser: argparse.ArgumentParser):
        JobSpec().define(parser)
        cli_add_arguments(None, parser, ['--dont-set-as-default'])

    def do_action_new(self, args):
        if os.path.isfile(Job.job_cache_file(args.job_name)):
            raise Exception("Job cache already exists: ", Job.job_cache_file(args.job_name))
        self.__job__.from_dict(vars(args), ignore_unkown=True)
        if not args.dont_set_as_default:
            Engine().process(['set', 'job-name={}'.format(args.job_name)])
        return self.__job__.to_dict()

    def define_arguments_preview(self, parser):
        cli_add_arguments(None, parser, ['--cluster-alias', '--job-name', '--v2', 'config'])

    def do_action_preview(self, args):
        fname = Job.default_job_config_filename("2" if args.v2 else "1")
        if args.v2:
            raise NotImplementedError
        else:
            job_config = self.__job__.to_job_config_v1(save_to_file=fname, cluster_info=get_client_cfg(args.cluster_alias, True)["match"])
        client = get_client(getattr(args, "cluster_alias", None))
        if client:
            pass
        if hasattr(args, "config") and args.config:
            to_file(job_config, args.config)
            return "write job config to %s" % args.config
        return job_config

    def define_arguments_sub(self, parser: argparse.ArgumentParser):
        JobSpec().define(parser)
        TaskRole().define(parser)
        cli_add_arguments(None, parser, ['--pip-flags'])
        cli_add_arguments(None, parser, ['--dont-set-as-default', '--v2', '--preview'])

    def do_action_sub(self, args):
        self.do_action_new(args)
        self.store(args)
        args_task = TaskRole().from_dict(vars(args), ignore_unkown=True, scene='task', action='add')
        Engine().process_args(args_task)
        if getattr(args, 'pip_flags', None):
            Engine().process(['require', 'pip'] + args.pip_flags)
        result = Engine().process_args(Namespace().from_dict(args, action="preview", config=None))
        if args.preview:
            return result
        return Engine().process_args(Namespace().from_dict(args, action="submit", config=None))


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
        return list2dict(client.config['storages'], 'storage_alias')

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
        return get_storage(args).upload(remote_path=args.remote_path, local_path=args.local_path, overwrite=args.overwrite)


def is_beta_version():
    return not pai.__sdk_branch__.startswith("sdk-release-")


__cluster_actions__ = {
    "list": ["list clusters in config file %s" % pai.__cluster_config_file__],
    "add": ["add a cluster to config file %s" % pai.__cluster_config_file__],
    "select": ["select a cluster as default"],
    "attach-hdfs": ["attach hdfs storage to cluster"],
}

__job_actions__ = {
    "list": ["list existing jobs"],
    "new": ["create a job config cache for submitting"],
    "preview": ["preview job config"],
    "submit": ["submit the job"],
    "sub": ["shortcut of submitting a job in one line"],
}

__task_actions__ = {
    "add": ["add a task role"],
}

__require_actions__ = {
    "pip": ["add pip dependencies"],
    "weblink": ["download weblink to folder"]
}

__storage_actions__ = {
    "list-storage": ["list storage attached to the cluster"],
    "list": ["list items about the remote path"],
    "status": ["get detailed information about remote path"],
    "upload": ["upload"],
    "download": ["download"],
    "delete": ["delete"],
}

__runtime_actions__ = {
    "execute": ["execute user commands"]
}


def factory(af: type(ActionFactory), actions: dict):
    return [af(x, actions) for x in actions.keys()]


__cli_structure__ = {
    # for release version 0.4
    "cluster": [
        "cluster management", factory(ActionFactoryForCluster, __cluster_actions__)
    ],
    "job": [
        "job operations", factory(ActionFactoryForJob, __job_actions__),
    ],
    "storage": [
        "storage operation", factory(ActionFactoryForStorage, __storage_actions__)
    ],
    "set": [
        "set a (default) variable for cluster and job", [ActionFactoryForDefault("set", {"set": ["set"]})]
    ],
    "unset": [
        "un-set a (default) variable for cluster and job", [ActionFactoryForDefault("unset", {"unset": ["unset"]})]
    ],
    # for future version
    "require": [
        "add requirements to job or task", factory(ActionFactoryForRequirement, __require_actions__)
    ],
    "runtime": [
        "runtime", factory(ActionFactoryForRuntime, __runtime_actions__)
    ],
    "task": [
        "configure task role", factory(ActionFactoryForTaskRole, __task_actions__)
    ],

}


class Engine(EngineFactory):

    def __init__(self):
        super().__init__(__cli_structure__)


def main():
    eng = Engine()
    result = eng.process(sys.argv[1:])
    if result:
        pprint(result)


if __name__ == '__main__':
    main()
