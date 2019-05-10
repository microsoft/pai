import argparse
import json, yaml
import os, sys
import openpaisdk as pai
from openpaisdk.io_utils import from_file, to_file
from openpaisdk.core import Client
from openpaisdk.job import TaskRole, JobSpec, Job
from openpaisdk.job import cli_add_arguments
import openpaisdk.runtime_requires as req
from openpaisdk.runtime import runtime_execute

def pprint(s, fmt: str='yaml', **kwargs):
    if fmt == 'json':
        print(json.dumps(s, indent=4, **kwargs))
    if fmt == 'yaml':
        print(yaml.dump(s, default_flow_style=False))


def get_client(alias):
    client, _ = Client.from_json(pai.__cluster_config_file__, alias)
    return client


def get_storage(args):
    client = get_client(args.cluster_alias)
    s_a = getattr(args, 'storage_alias', None)
    if s_a is None:
        return client.storage
    else:
        return client.storages[s_a]


class Action:

    def __init__(self, action: str, help_s: str):
        self.action, self.help_s = action, help_s
    
    def define_arguments(self, parser: argparse.ArgumentParser):
        pass

    def check_arguments(self, args):
        pass

    def restore(self, args):
        pass

    def store(self, args):
        pass

    def do_action(self, args):
        raise NotImplementedError


class ActionFactory(Action): 

    def __init__(self, action: str, allowed_actions: dict):
        assert action in allowed_actions, ("unsupported action of job", action)
        super().__init__(action, allowed_actions[action][0])
        suffix = action.replace('-', '_')
        self.define_arguments = getattr(self, "define_arguments_" + suffix, super().define_arguments)
        self.do_action = getattr(self, "do_action_" + suffix, None)


class Scene:

    def __init__(self, scene: str, help_s: str, parser: argparse.ArgumentParser,
        action_list # type: list[Action]
        ):
        self.scene, self.help_s  = scene, help_s
        self.single_action = len(action_list) == 1 and scene == action_list[0].action
        if self.single_action:
            action_list[0].define_arguments(parser)
            self.do_action = action_list[0].do_action
        else:
            self.actions, subparsers = dict(), parser.add_subparsers(dest='action', help=help_s)
            for a in action_list:
                p = subparsers.add_parser(a.action, help=a.help_s)
                a.define_arguments(p)
                self.actions[a.action] = a

    def process(self, args):
        actor = self if self.single_action else self.actions[args.action]
        actor.check_arguments(args)
        actor.restore(args)
        result = actor.do_action(args)
        actor.store(args)
        return result


class ActionFactoryForDefault(ActionFactory):

    def define_arguments_add(self, parser: argparse.ArgumentParser):
        parser.add_argument('contents', nargs='+', help='(variable=value) pair to be set as default')

    def do_action_add(self, args):
        for kv in args.contents:
            key, value = kv.split('=')
            pai.__defaults__[key] = value
        to_file(pai.__defaults__, pai.__local_default_file__)
        return pai.__defaults__

    def define_arguments_list(self, parser: argparse.ArgumentParser):
        pass

    def do_action_list(self, args):
        return pai.__defaults__

    def define_arguments_remove(self, parser: argparse.ArgumentParser):
        parser.add_argument('variables', nargs='+', help='(variable=value) pair to be set as default')

    def do_action_remove(self, args):
        result = []
        for key in args.variables:
            value = pai.__defaults__.pop(key, None)
            result.append("default variable {} (previously {}) deleted".format(key, value))
        to_file(pai.__defaults__, pai.__local_default_file__)
        return result


class ActionFactoryForCluster(ActionFactory):

    def define_arguments_list(self, parser):
        cli_add_arguments(None, parser, ['--cluster-alias', '--name'])

    def do_action_list(self, args):
        cfgs = {cluster['alias']: cluster for cluster in from_file(pai.__cluster_config_file__, default=[])}
        for v in cfgs.values():
            v['passwd'] = "******"
        return cfgs[args.cluster_alias] if args.cluster_alias else list(cfgs.keys()) if args.name else cfgs


class ActionFactoryForJob(ActionFactory):

    def restore(self, args):
        self.__job__ = Job.restore(args.job_name)

    def store(self, args):
        self.__job__.store()

    def define_arguments_list(self, parser: argparse.ArgumentParser):
        cli_add_arguments(None, parser, ['--cluster-alias', '--name'])
        parser.add_argument('job_name', metavar='job name', nargs='?')
        parser.add_argument('query', nargs='?', choices=['config', 'ssh'])

    def do_action_list(self, args):
        client = get_client(args.cluster_alias)
        result = client.rest_api_jobs(args.job_name, args.query)
        if args.name:
            assert not args.query, 'cannot use --name with query at the same time'
            result = [j['name'] for j in result]
        return result                

    def define_arguments_new(self, parser: argparse.ArgumentParser):
        JobSpec().define(parser)
        cli_add_arguments(None, parser, ['--update', '--dont-set-as-default'])

    def do_action_new(self, args):
        if os.path.isfile(Job.job_cache_file(args.job_name)): 
            if not getattr(args, 'update', False):
                raise Exception("Job cache already exists: ", Job.job_cache_file(args.job_name))
        self.__job__.from_dict(vars(args), ignore_unkown=True)
        self.__job__.store()
        if not args.dont_set_as_default:
            Engine().process(['default', 'add', 'job-name={}'.format(args.job_name)]) 
        return self.__job__.to_dict()

    def define_arguments_submit(self, parser: argparse.ArgumentParser):
        cli_add_arguments(None, parser, ['--job-name', '--cluster-alias', '--preview', 'config'])

    def do_action_submit(self, args):
        client = get_client(args.cluster_alias)
        if args.config:
            return client.get_token().rest_api_submit(from_file(args.config))
        job_config = self.__job__.to_job_config_v1(save_to_file=self.__job__.get_config_file())
        if args.preview:
            return job_config
        client.submit(self.__job__, job_config)
        return client.get_job_link(args.job_name)

    def define_arguments_fast(self, parser: argparse.ArgumentParser):
        JobSpec().define(parser)
        TaskRole().define(parser)
        cli_add_arguments(None, parser, ['--dont-set-as-default'])

    def do_action_fast(self, args):
        self.do_action_create(args)
        if not getattr(args, 'task_role_name', None):
            args.task_role_name = 'main'
        self.do_action_task(args)
        return self.do_action_submit(args)


class ActionFactoryForTaskRole(ActionFactory):

    def restore(self, args):
        self.__job__ = Job.restore(args.job_name)

    def store(self, args):
        self.__job__.store()

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
        self.__job__.store()
        return elem.to_dict()


class ActionFactoryForRequirement(ActionFactory):

    def restore(self, args):
        self.__job__ = Job.restore(args.job_name)

    def store(self, args):
        self.__job__.store()

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
        return client.config['storages']

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


__cluster_actions__ = {
    "list": ["list clusters in config file %s" % pai.__cluster_config_file__]
}

__default_actions__ = {
    "list": ["list existing default variables"],
    "add": ["add new variable-value pair"],
    "remove": ["remove existing default variables"],
}

__job_actions__ = {
    "list": ["list existing jobs"],
    "new": ["create a job config cache for submitting"],
    "require": ["add requirements (prerequisites) for job (or task)"],
    "submit": ["submit the job"],
    "abort": ["remove local cache of the job"],
    "fast": ["shortcut of submitting a job in one line"],
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
    "cluster": [
        "cluster management", [ActionFactoryForCluster('list', __cluster_actions__)]
    ],
    "job": [
        "job operations", factory(ActionFactoryForJob, __job_actions__),
    ],
    "require": [
        "add requirements to job or task", factory(ActionFactoryForRequirement, __require_actions__)
    ],
    "default": [
        "set or show defaults", factory(ActionFactoryForDefault, __default_actions__)
    ],
    "runtime": [
        "runtime", factory(ActionFactoryForRuntime, __runtime_actions__)
    ],
    "task": [
        "configure task role", factory(ActionFactoryForTaskRole, __task_actions__)
    ],
    "storage": [
        "storage operation", factory(ActionFactoryForStorage, __storage_actions__)
    ]
}


class Engine:

    def __init__(self):
        self.parser = argparse.ArgumentParser(description='command line interface for OpenPAI')
        subparsers = self.parser.add_subparsers(dest='scene', help='openpai cli working scenarios')
        self.scenes = dict()
        for k, v in __cli_structure__.items():
            p = subparsers.add_parser(k, help=v[0])
            self.scenes[k] = Scene(k, v[0], p, v[1])

    def process(self, a: list):
        pai.__logger__.debug("Received arguments %s", a)
        args = self.parser.parse_args(a)
        pai.__logger__.debug("Parsed arguments %s", args)
        return self.scenes[args.scene].process(args)


def main():
    eng = Engine()
    pprint(eng.process(sys.argv[1:]))


if __name__ == '__main__':
    main()
