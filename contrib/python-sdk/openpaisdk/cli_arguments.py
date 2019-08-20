"""This file provides a mechanism to couple a Namespace (argparse) and pai protocol
"""
import argparse
import inspect
import typing
from copy import deepcopy
from openpaisdk import __logger__
from openpaisdk.defaults import get_defaults
from typing import Union


def get_args(
    expand=['kwargs'],  # type: list
    ignore=['self']  # type: list
):
    # type (...) -> dict
    """if used at the first of a function, will return its arguments"""
    caller = inspect.currentframe().f_back
    dic = {k: v for k, v in caller.f_locals.items() if k not in ignore and not k.startswith('__')}
    for k in expand:
        v = dic.pop(k, {})
        dic.update(v)
    return dic


class ArgumentFactory:

    def __init__(self):
        self.factory = dict()

        # deal with predefined defaults
        for p in get_defaults().predefined:
            args = ['--' + p.name]
            if p.abbreviation:
                args += [('-' if len(p.abbreviation) == 1 else '--') + p.abbreviation]
            kwargs = dict(help=p.description)
            if isinstance(p.default, list):
                kwargs.update(action='append', default=None)
            else:
                kwargs.update(default=p.default)
            self.add_argument(*args, **kwargs)

        # cluster
        self.add_argument('cluster_alias', help='cluster alias to select')

        self.add_argument('--pai-uri', help="uri of openpai cluster, in format of http://x.x.x.x")
        self.add_argument('--user', help='username')
        self.add_argument('--password', help="password")
        self.add_argument('--authen-token', '--token', help="authentication token")

        self.add_argument('--editor', default="code", help="path to your editor used to open files")

        # job spec
        self.add_argument('--job-name', '-j', help='job name')

        self.add_argument('--is-global', '-g', action="store_true",
                          help="set globally (not limited to current working folder)", default=False)
        self.add_argument('--update', '-u', action='append',
                          help='replace current key-value pairs with new key=value (key1:key2:...=value for nested objects)')
        self.add_argument('--preview', action='store_true', help='preview result before doing action')
        self.add_argument('--no-browser', action='store_true', help='does not open the job link in web browser')
        self.add_argument('--interactive', action='store_true', help='enter the interactive mode after job starts')
        self.add_argument('--notebook-token', '--token', default="abcd", help='jupyter notebook authentication token')
        self.add_argument("--python", default="python",
                          help="command or path of python, default is {python}, may be {python3}")

        self.add_argument('--cmd-sep', default="\s*&&\s*", help="command separator, default is (&&)")
        self.add_argument('commands', nargs=argparse.REMAINDER, help='shell commands to execute')

        # runtime
        self.add_argument('config', nargs='?', help='job config file')
        self.add_argument('notebook', nargs='?', help='Jupyter notebook file')

        # storage
        self.add_argument('--recursive', action='store_true', default=False, help="recursive target operation")
        self.add_argument('--overwrite', action='store_true', default=False, help="enable overwrite if exists")
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


def append_options_to_list(args: argparse.Namespace, keys: list):
    for k in keys:
        if not hasattr(args, k):
            __logger__.warn("option %s not found, please check it", k)
        if getattr(args, k, None) is None:
            setattr(args, k, [])
