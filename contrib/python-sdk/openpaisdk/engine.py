import argparse
import json, yaml
import os, sys
import uuid
import copy
import openpaisdk as pai
from openpaisdk.io_utils import from_file, to_file
from openpaisdk.core import Client
from openpaisdk.job import TaskRole, JobSpec, Job, define_common_arguments
from subprocess import check_call


def pprint(s, fmt: str='yaml', **kwargs):
    if fmt == 'json':
        print(json.dumps(s, indent=4, **kwargs))
    if fmt == 'yaml':
        print(yaml.dump(s, default_flow_style=False))


class Action:

    def __init__(self, action: str, help_s: str):
        self.action, self.help_s = action, help_s
        self._client_, self.alias = None, None
    
    def define_arguments(self, parser: argparse.ArgumentParser):
        pass

    def check_arguments(self, args):
        pass

    def do_action(self, args):
        raise NotImplementedError

    def get_client(self, args):
        alias = args.alias
        if not alias:
            alias = pai.__defaults__.get('cluster-alias', None)
        if not alias and len(pai.__clients__)==1:
            alias = list(pai.__clients__.keys())[0]
        self.client, self.alias = Client(**pai.__clients__[alias]), alias
        return self.client, self.alias


class ActionFactory(Action): 

    def __init__(self, action: str, allowed_actions: dict):
        assert action in allowed_actions, ("unsupported action of job", action)
        super().__init__(action, allowed_actions[action][0])
        self.define_arguments = getattr(self, "define_arguments_" + action, None)
        self.do_action = getattr(self, "do_action_" + action, None)


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
        return actor.do_action(args)


class ActionDefaultFactory(ActionFactory):

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


class ActionListCluster(Action):

    def __init__(self):
        super().__init__('list', 'list clusters')

    def define_arguments(self, parser):
        define_common_arguments(parser, ['alias', 'name'])

    def do_action(self, args):
        cfgs = copy.deepcopy(pai.__clients__)
        for v in cfgs.values():
            v['passwd'] = "******"
        return cfgs[args.alias] if args.alias else list(cfgs.keys()) if args.name else cfgs


class ActionJobFactory(ActionFactory):

    def __init__(self, action: str, allowed_actions: dict):
        super().__init__(action, allowed_actions)
        self.__job__ = Job()

    def check_arguments(self, args):
        if self.action in  "create task submit".split():
            assert args.job_name, ("no job-name defined", args)
            self.__job__.restore(args.job_name)

    def define_arguments_list(self, parser: argparse.ArgumentParser):
        define_common_arguments(parser, ['alias', 'name'])
        parser.add_argument('job_name', metavar='job name', nargs='?')
        parser.add_argument('query', nargs='?', choices=['config', 'ssh'])

    def do_action_list(self, args):
        self.get_client(args)
        result = self.client.rest_api_jobs(args.job_name, args.query)
        if args.name:
            assert not args.query, 'cannot use --name with query at the same time'
            result = [j['name'] for j in result]
        return result                

    def define_arguments_create(self, parser: argparse.ArgumentParser):
        JobSpec().define(parser)
        define_common_arguments(parser, ['update', 'dont-set-as-default'])

    def do_action_create(self, args):
        if os.path.isfile(Job.job_cache_file(args.job_name)): 
            if not getattr(args, 'update', False):
                raise Exception("Job cache already exists: ", Job.job_cache_file(args.job_name))
        self.__job__.spec.from_dict(vars(args), ignore_unkown=True)
        self.__job__.store()
        if not args.dont_set_as_default:
            Engine().process(['default', 'add', 'job-name={}'.format(args.job_name)]) 
        return self.__job__.spec.to_dict()

    def define_arguments_task(self, parser: argparse.ArgumentParser):
        TaskRole().define(parser)
        define_common_arguments(parser, ['update'])

    def do_action_task(self, args):
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

    def define_arguments_submit(self, parser: argparse.ArgumentParser):
        define_common_arguments(parser, ['job-name', 'alias', 'config'])

    def do_action_submit(self, args):
        self.get_client(args)
        if args.config:
            return self.client.get_token().rest_api_submit(from_file(args.config))
        self.client.submit(self.__job__)
        return self.client.get_job_link(args.job_name)

    def define_arguments_fast(self, parser: argparse.ArgumentParser):
        JobSpec().define(parser, common=['job-name', 'alias', 'dont-set-as-default', 'config'])
        TaskRole().define(parser, common=[])

    def do_action_fast(self, args):
        self.do_action_create(args)
        self.do_action_task(args)
        return self.do_action_submit(args)


__default_actions__ = {
    "list": ["list exising default variables"],
    "add": ["add new variable-value pair"],
    "remove": ["remove existing default variables"],
}

__job_actions__ = {
    "list": ["list existing jobs"],
    "create": ["create a job config cache for submitting"],
    "task": ["add a task role"],
    "submit": ["submit the job"],
    "abort": ["remove local cache of the job"],
    "fast": ["shortcut of submitting a job in one line"]
}

__cli_structure__ = {
    "cluster": [
        "cluster management", [ActionListCluster()]
    ],
    "job": [
        "job operations", [ActionJobFactory(x, __job_actions__) for x in "list create task submit fast".split()]   
    ],
    "default": [
        "set or show defaults", [ActionDefaultFactory(x, __default_actions__) for x in "list add remove".split()]
    ],
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
        args = self.parser.parse_args(a)
        return self.scenes[args.scene].process(args)


def main():
    eng = Engine()
    pprint(eng.process(sys.argv[1:]))

if __name__ == '__main__':
    main()
