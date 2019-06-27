"""This file provides a mechanism to couple a Namespace (argparse) and pai protocol
"""
import argparse
import inspect
import typing
from copy import deepcopy
from openpaisdk import __logger__
from openpaisdk.io_utils import from_file, get_defaults
from typing import Union


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


def get_dest_name(option: str):
    while option[0] == "-":
        option = option[1:]
    return option.replace('-', '_')


def dict_to_argv(parser: argparse.ArgumentParser, dic: dict):
    args_map = {a.dest: a for a in parser._actions}
    flags = []
    lst = list(dic.keys())
    for key in lst:
        if key not in args_map:
            continue
        value = dic.pop(key)
        arg = args_map[key]
        if arg.const is not None:
            if value == arg.const:
                flags.append(arg.option_strings[0])
            else:
                assert (not value) == arg.const, (value, arg.const)
        else:
            flags.extend([arg.option_strings[0], value])
    return flags


class Namespace(argparse.Namespace):
    __type__ = ''
    __fields__ = dict(
        # field_name: default_value
    )

    def __init__(self, **kwargs):
        self.from_dict(kwargs)

    def from_dict(self, dic: Union[dict, "Namespace"], ignore_unkown: bool = False, **kwargs):
        """inherite from a dict or another Namespace"""
        if isinstance(dic, argparse.Namespace):
            dic = vars(dic)
        dic.update(kwargs)
        dic2 = deepcopy(dic)
        self.define(self.parser)
        lst = dict_to_argv(self.parser, dic2)
        print(lst)
        self.parser.parse_known_args(lst, self)
        if not ignore_unkown:
            for k, v in dic2.items():
                setattr(self, k, v)
        return self

    def params_help(self):
        self.parser.print_help()

    def to_dict(self):
        dic = {k:v for k, v in vars(self).items() if not k.startswith("_")}
        for k, v in dic.items():
            if isinstance(v, Namespace):
                dic[k] = v.to_dict()
            if isinstance(v, list) and len(v) > 0 and isinstance(v[0], Namespace):
                dic[k] = [x.to_dict() for x in v]
        return dic

    def define(self, parser: argparse.ArgumentParser):
        for key, value in self.__fields__.items():
            setattr(self, key, value)
        return parser

    @property
    def parser(self):
        if not getattr(self, "__parser__", None):
            cls_name = self.__module__ + "." + self.__class__.__name__
            self.__parser__ = argparse.ArgumentParser(
                add_help=False,
                conflict_handler='resolve',
                prog=cls_name,
                description="define parameters for class %s" % cls_name
            )
        return self.__parser__

    def update_argument(self, parser: argparse.ArgumentParser, option: str, **kwargs):
        for a in parser._actions:
            if option in a.option_strings:
                dic = vars(a)
                for k, v in kwargs.items():
                    setattr(a, k, v)
                return
        raise Exception("option %s not found", option)


class ArgumentFactory:

    def __init__(self):
        self.factory = dict()
        defaults = get_defaults()
        # cluster
        self.add_argument('--cluster-alias', '-a', default=defaults.get('cluster-alias', None), help='cluster alias to select')
        self.add_argument('--virtual-cluster', '--vc', default=defaults.get('virtual-cluster', None), help='virtual cluster to use')
        self.add_argument('cluster_alias', help='cluster alias to select')

        self.add_argument('--pai-uri', help="uri of openpai cluster, in format of http://x.x.x.x")
        self.add_argument('--user', help='username')
        self.add_argument('--password', help="password")

        # storage
        self.add_argument('--storage-alias', '-s', help='storage alias')
        self.add_argument('--web-hdfs-uri', help="uri of web hdfs, in format of http://x.x.x.x:port")

        # job spec
        self.add_argument('--job-name', '-j', help='job name', default=defaults.get('job-name', None))
        self.add_argument('--workspace', '-w', default=defaults.get('workspace', None), help='remote path for workspace (store code, output, ...)')
        self.add_argument('--v2', action="store_true", default=False, help="use job protocol version 2")
        self.add_argument('--sources', '-s', action='append', help='sources files')

        # requirements
        self.add_argument('--image', '-i', default=defaults.get('image', None), help='docker image')
        self.add_argument('--pip-flags', '-p', action='append', help='pip install -U <all-is-flags>')
        self.add_argument('pip_flags', nargs='*', help='pip install -U <all-is-flags>')
        self.add_argument("--rename", "-r", help="rename downloaded file")
        self.add_argument('weblink', help="download http (or https) web link")
        self.add_argument('folder', help="target folder")

        # common
        self.add_argument('--details', help='if asserted, show details of the job (or cluster)', action='store_true', default=False)
        self.add_argument('--default', help='set current as default', action='store_true', default=False)
        self.add_argument('--update', '-u', action='append', help='replace current key-value pairs with new key=value (key1:key2:...=value for nested objects)')
        self.add_argument('--preview', action='store_true', help='preview result before doing action')
        self.add_argument('--interactive', action='store_true', help='enter the interactive mode after job starts')
        self.add_argument('--token', default="abcd", help='authentication token')
        self.add_argument('--enable-sdk', action="store_true", default=False, help="enable sdk installation")
        self.add_argument("--pip-path", default="pip", help="command or path of pip, default is {pip}, may be {pip3} {python3 -m pip}")
        self.add_argument("--pip-installs", help="packages to be added by {pip install}")
        # task role
        self.add_argument('--task-role-name', '-t', default='main', help='task role name')
        self.add_argument('--task-number', '-n', type=int, default=1, help='number of tasks per role')
        self.add_argument('--cpu', type=int, default=defaults.get('cpu', 4), help='cpu number per instance')
        self.add_argument('--gpu', type=int, default=defaults.get('gpu', 0), help='gpu number per instance')
        self.add_argument('--memoryMB', type=int, default=defaults.get('memMB', 8192), help='memory #MB per instance')
        self.add_argument('--cmd-sep', default="&&", help="command separator, default is (&&)")
        self.add_argument('commands', nargs=argparse.REMAINDER, help='shell commands to execute')

        # runtime
        self.add_argument('config', nargs='?', help='job config file')
        self.add_argument('notebook', nargs='?', help='Jupyter notebook file')
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


def cli_add_arguments(parser: argparse.ArgumentParser, args: list):
    for a in args:
        args, kwargs = __arguments_factory__.get(a)
        # assert parser.conflict_handler == 'resolve', "set conflict_handler to avoid duplicated"
        parser.add_argument(*args, **kwargs)

