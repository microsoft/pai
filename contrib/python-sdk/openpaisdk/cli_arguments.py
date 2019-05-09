"""This file provides a mechanism to couple a Namespace (argparse) and pai protocol
"""
import argparse
import inspect
from copy import deepcopy
from openpaisdk import __defaults__


def attach_args(target=None, expand: list = ['kwargs'], ignore: list = ['self']):
    caller = inspect.currentframe().f_back
    dic = {k: v for k, v in caller.f_locals.items() if k not in ignore and not k.startswith('__')}
    for k in expand:
        v = dic.pop(k, {})
        dic.update(v)
    if target:
        for k, v in dic.items():
            setattr(target, k, v)
    return dic


class Namespace(argparse.Namespace):
    __type__ = 'prerequisite'
    __fields__ = dict(
        # field_name: (description, default)
    )

    def __init__(self, **kwargs):
        self.type = self.__type__
        self.from_argv()
        dic = {k: deepcopy(v[1]) for k, v in self.__fields__.items()}
        dic.update(kwargs)
        self.from_dict(dic)

    def add_argument(self, parser: argparse.ArgumentParser, *args, **kwargs):
        if args[0][2:].replace('-', '_') in [a.dest for a in parser._actions]:
            return None
        parser.add_argument(*args, **kwargs)

    def to_dict(self):
        dic = vars(self)
        for k, v in dic.items():
            if isinstance(v, Namespace):
                dic[k] = v.to_dict()
            if isinstance(v, list) and len(v) > 0 and isinstance(v[0], Namespace):
                dic[k] = [x.to_dict() for x in v]
        return dic

    def define(self, parser: argparse.ArgumentParser):
        pass

    def from_argv(self, argv: list = []):
        parser = argparse.ArgumentParser()
        self.define(parser)
        parser.parse_known_args(argv, self)
        return self

    def from_dict(self, dic: dict, ignore_unkown: bool = False):
        for k, v in dic.items():
            if ignore_unkown and not hasattr(self, k):
                continue
            setattr(self, k, v)
        return self


class ArgumentFactory:

    def __init__(self):
        self.factory = dict()

        # cluster
        self.add_argument('--alias', '-a', help='cluster alias to select')

        # job spec
        self.add_argument('--job-name', '-j', help='job name', default=__defaults__.get('job-name', None))
        self.add_argument('--workspace', '-w', default=__defaults__.get('workspace', None), help='remote path for workspace (store code, output, ...)')
        self.add_argument('--protocol', default='1.0', help='protocol version')
        self.add_argument('--sources', '-s', action='append', help='sources files')
        self.add_argument('--disable-sdk-install', '-d', action='store_true', default=False, help='disable installing of openpaisdk from github')

        # requirements
        self.add_argument('--image', '-i', default=__defaults__.get('image', None), help='docker image')
        self.add_argument('--pip-flags', '-p', action='append', help='pip install -U <all-is-flags>')
        self.add_argument('pip_flags', nargs='*', help='pip install -U <all-is-flags>')
        self.add_argument('weblink', nargs='?', help="download http (or https) web link")
        self.add_argument('folder', nargs='?', help="target folder")

        # common
        self.add_argument('--name', help='if asserted, show name / alias only; otherwise show all details', action='store_true', default=False)
        self.add_argument('--update', '-u', action='store_true', default=False, help='update current job cache')
        self.add_argument('--dont-set-as-default', action="store_true", default=False, help="dont set current (job) as default")
        self.add_argument('--preview', action='store_true', help='preview result before doing action')

        # task role
        self.add_argument('--task-role-name', '-t', help='task role name')
        self.add_argument('--task-number', '-n', type=int, default=1, help='number of tasks per role')
        self.add_argument('--cpu', type=int, default=__defaults__.get('cpu', 1), help='cpu number per instance')
        self.add_argument('--gpu', type=int, default=__defaults__.get('gpu', 0), help='gpu number per instance')
        self.add_argument('--mem', type=int, default=__defaults__.get('memMB', 1024), help='memory #MB per instance')
        self.add_argument('commands', nargs=argparse.REMAINDER, help='shell commands to execute')

        # runtime
        self.add_argument('config', nargs='?', help='job config file')
        self.add_argument('--working-dir', default='', help="working directory")

    def add_argument(self, *args, **kwargs):
        self.factory[args[0]] = dict(args=args, kwargs=kwargs)

    def get(self, key):
        value = self.factory[key]
        return value['args'], value['kwargs']


__arguments_factory__ = ArgumentFactory()


def cli_add_arguments(target: Namespace, parser: argparse.ArgumentParser, args: list):
    for a in args:
        args, kwargs = __arguments_factory__.get(a)
        if target is None:
            parser.add_argument(*args, **kwargs)
        else:
            target.add_argument(parser, *args, **kwargs)
