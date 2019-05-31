"""This file provides a mechanism to couple a Namespace (argparse) and pai protocol
"""
import argparse
import inspect
import typing
from copy import deepcopy
from openpaisdk import __defaults__, __logger__

def get_args(
    expand=['kwargs'], # type: list
    ignore=['self'] # type: list
):
    # type (...) -> dict
    """if used at the first of a function, will return its arguments"""
    caller = inspect.currentframe().f_back
    dic = {k: v for k, v in caller.f_locals.items() if k not in ignore and not k.startswith('__')}
    for k in expand:
        v = dic.pop(k, {})
        dic.update(v)
    return dic


class Namespace(argparse.Namespace):
    __type__ = ''
    __fields__ = dict(
        # field_name: (description, default)
    )

    def __init__(self, **kwargs):
        if self.__type__:
            self.type = self.__type__
        self.from_argv()
        dic = {k: deepcopy(v) for k, v in self.__fields__.items()}
        dic.update(kwargs)
        self.from_dict(dic)

    def add_argument(self,
                     parser, #type: argparse.ArgumentParser
                     *args, **kwargs):
        assert isinstance(parser, argparse.ArgumentParser), "wrong type %s of parser" % type(parser)
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

    def define(self,
               parser, #type: argparse.ArgumentParser
               ):
        pass

    def from_argv(self, argv: list = []):
        parser = argparse.ArgumentParser()
        self.define(parser)
        if len(argv) == 0:  # for initializing
            for a in parser._actions:
                if a.dest == 'help' or a.default == argparse.SUPPRESS:
                    continue
                setattr(self, a.dest, a.default)
        else:
            parser.parse_known_args(argv, self)
        return self

    def from_dict(self, dic: dict, ignore_unkown: bool = False, **kwargs):
        if isinstance(dic, argparse.Namespace):
            dic = vars(dic)
        for k, v in dic.items():
            if ignore_unkown and not hasattr(self, k):
                continue
            setattr(self, k, v)
        for k, v in kwargs.items():
            setattr(self, k, v)
        return self


class ArgumentFactory:

    def __init__(self):
        self.factory = dict()

        # cluster
        self.add_argument('--cluster-alias', '-a', default=__defaults__.get('cluster-alias', None), help='cluster alias to select')
        self.add_argument('cluster_alias', help='cluster alias to select')

        self.add_argument('--pai-uri', help="uri of openpai cluster, in format of http://x.x.x.x")
        self.add_argument('--user', help='username')
        self.add_argument('--passwd', help="password")

        # storage
        self.add_argument('--storage-alias', help='storage alias')
        self.add_argument('--web-hdfs-uri', help="uri of web hdfs, in format of http://x.x.x.x:port")

        # job spec
        self.add_argument('--job-name', '-j', help='job name', default=__defaults__.get('job-name', None))
        self.add_argument('--workspace', '-w', default=__defaults__.get('workspace', None), help='remote path for workspace (store code, output, ...)')
        self.add_argument('--code-dir', help="use a existing remote directory as code directory, if not specified, use <workspace>/jobs/<job-name>/code instead")
        self.add_argument('--v2', action="store_true", default=False, help="use job protocol version 2")
        self.add_argument('--rename', action="store_true", default=False, help="change name in config file according to --job-name")
        self.add_argument('--sources', '-s', action='append', help='sources files')
        self.add_argument('--disable-sdk-install', '-d', action='store_true', default=False, help='disable installing of openpaisdk from github')

        # requirements
        self.add_argument('--image', '-i', default=__defaults__.get('image', None), help='docker image')
        self.add_argument('--pip-flags', '-p', action='append', help='pip install -U <all-is-flags>')
        self.add_argument('pip_flags', nargs='*', help='pip install -U <all-is-flags>')
        self.add_argument("--rename", "-r", help="rename downloaded file")
        self.add_argument('weblink', help="download http (or https) web link")
        self.add_argument('folder', help="target folder")

        # common
        self.add_argument('--name', help='if asserted, show name / alias only; otherwise show all details', action='store_true', default=False)
        self.add_argument('--update', '-u', action='store_true', default=False, help='update current job cache')
        self.add_argument('--dont-set-as-default', action="store_true", default=False, help="dont set current (job) as default")
        self.add_argument('--preview', action='store_true', help='preview result before doing action')

        # task role
        self.add_argument('--task-role-name', '-t', default='main', help='task role name')
        self.add_argument('--task-number', '-n', type=int, default=1, help='number of tasks per role')
        self.add_argument('--cpu', type=int, default=__defaults__.get('cpu', 1), help='cpu number per instance')
        self.add_argument('--gpu', type=int, default=__defaults__.get('gpu', 0), help='gpu number per instance')
        self.add_argument('--mem', type=int, default=__defaults__.get('memMB', 1024), help='memory #MB per instance')
        self.add_argument('commands', nargs=argparse.REMAINDER, help='shell commands to execute')

        # runtime
        self.add_argument('config', nargs='?', help='job config file')
        self.add_argument('--working-dir', default='', help="working directory")

        # storage
        self.add_argument('--storage-alias', help="alias of storage attached to cluster")
        self.add_argument('--recursive', help="recursive target operation")
        self.add_argument('--overwrite', help="enable overwrite if exists")
        self.add_argument('local_path', help="local path")
        self.add_argument('remote_path', help="remote path")

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


def not_not(args: typing.Union[argparse.Namespace, Namespace], keys: list):
    "all fields (named in keys) of args can not be None or empty string ((not args.keys) == False)"
    for key in keys:
        k = key[2:] if key.startswith("--") else key
        k = k.replace('-', '_')
        assert getattr(args, k, None), "arguments %s not defined" % key
