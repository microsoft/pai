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


"""This file provides a mechanism to couple a Namespace (argparse) and pai protocol
"""
import argparse
from openpaisdk.defaults import LayeredSettings
from openpaisdk.io_utils import to_screen


def add_arguments():
    if CliRegistery.arguments:
        return

    # deal with predefined defaults
    for name, params in LayeredSettings.definitions.items():
        args = ['--' + name]
        abbr = params.get('abbreviation', None)
        if abbr:  # args = ['--{name}', '-{abbr}' or '--{abbr}']
            args += [('-' if len(abbr) == 1 else '--') + abbr]
        kwargs = {k: v for k, v in params.items() if k not in ["name", "abbreviation"]}
        kwargs["default"] = LayeredSettings.get(name)
        CliRegistery.add_argument(*args, **kwargs)

    # cluster
    CliRegistery.add_argument('cluster_alias', help='cluster alias to select')

    CliRegistery.add_argument('--pai-uri', help="uri of openpai cluster, in format of http://x.x.x.x")
    CliRegistery.add_argument('--user', help='username')
    CliRegistery.add_argument('--password', help="password")
    CliRegistery.add_argument('--authen-token', '--token', dest='token', help="authentication token")

    CliRegistery.add_argument('--storage-name', help="storage mountPoint for system use")

    CliRegistery.add_argument('--type', help="type")
    CliRegistery.add_argument('--address', help="address for storage server")
    CliRegistery.add_argument('--path', help="remote path on server")

    CliRegistery.add_argument('--editor', default="code", help="path to your editor used to open files")

    # defaults
    CliRegistery.add_argument('--is-global', '-g', action="store_true", help="set globally (not limited to current working folder)", default=False)
    CliRegistery.add_argument('contents', nargs='*', help='(variable=value) pair to be set as default')

    # job spec
    CliRegistery.add_argument('--job-name', '-j', help='job name')
    CliRegistery.add_argument('job_name', help='job name')
    CliRegistery.add_argument('job_names', nargs='+', help='job name')

    CliRegistery.add_argument('query', nargs='?', choices=['config', 'ssh'])

    CliRegistery.add_argument('--update', '-u', action='append',
                              help='replace current key-value pairs with new key=value (key1:key2:...=value for nested objects)')
    CliRegistery.add_argument('--preview', action='store_true', help='preview result before doing action')
    CliRegistery.add_argument('--no-browser', action='store_true', help='does not open the job link in web browser')
    CliRegistery.add_argument('--interactive', action='store_true', help='enter the interactive mode after job starts')
    CliRegistery.add_argument('--notebook-token', '--token', dest='token', default="abcd",
                              help='jupyter notebook authentication token')
    CliRegistery.add_argument("--python", default="python",
                              help="command or path of python, default is {python}, may be {python3}")

    CliRegistery.add_argument('--cmd-sep', default="\s*&&\s*", help="command separator, default is (&&)")
    CliRegistery.add_argument('commands', nargs=argparse.REMAINDER, help='shell commands to execute')
    CliRegistery.add_argument('--timeout', help='time period for empty container to running\
                                                 (s - seconds\
                                                 m - minutes\
                                                 h - hours\
                                                 d - days)')

    # runtime
    CliRegistery.add_argument('config', nargs='?', help='job config file')
    CliRegistery.add_argument('notebook', nargs='?', help='Jupyter notebook file')

    # storage
    CliRegistery.add_argument('--recursive', action='store_true', default=False, help="recursive target operation")
    CliRegistery.add_argument('--overwrite', action='store_true', default=False, help="enable overwrite if exists")
    CliRegistery.add_argument('path_1', help='file or folder locaiton')
    CliRegistery.add_argument('path_2', help='file or folder locaiton')


class CliRegistery:

    entries = dict()  # dictionary of commands and its config ('args', 'help', 'func' and 'fn_check')
    arguments = dict()

    @classmethod
    def add_argument(cls, *opts, **kwargs):
        if opts[0] in cls.arguments:
            to_screen("{} already exists and will be overriden".format(opts), _type='warn')
        cls.arguments[opts[0]] = {
            'flags': opts,
            'kwargs': kwargs,
        }

    def __init__(self):
        parser = argparse.ArgumentParser(
            description="command line interface for OpenPAI",
            formatter_class=argparse.ArgumentDefaultsHelpFormatter
        )
        subparser = parser.add_subparsers(
            dest="cmd",
            help="openpai cli commands"
        )
        parser._parsers = {}
        for cmd, cfg in self.entries.items():
            p = subparser.add_parser(cmd, help=cfg.get('help', None))  # parser for the command
            for a in cfg.get('args', []):
                p.add_argument(*self.arguments[a]['flags'], **self.arguments[a]['kwargs'])
            parser._parsers[cmd] = p 
        self.parser = parser

    def process(self, a: list):
        args = self.parser.parse_args(a)
        if args.cmd not in self.entries:
            self.parser.print_help()
            return
        try:
            fn_check = self.entries[args.cmd].get('fn_check', None)
            if fn_check:
                fn_check(args)
            return self.entries[args.cmd]['func'](args)
        except AssertionError as identifier:
            to_screen(repr(identifier), _type='warn')
            self.parser._parsers[args.cmd].print_help()
            raise Exception(identifier)
        except Exception as identifier:
            raise Exception(identifier)



add_arguments()


class register_as_cli:
    "the decorator to register a function as cli command"

    def __init__(self, cmd: str, args: list = None, help: str = None, fn_check=None):
        self.keys = [cmd] if isinstance(cmd, str) else cmd
        self.entry = dict(help=help, args=args, fn_check=fn_check)

    def __call__(self, func):
        self.entry.update(func=func)
        for key in self.keys:
            CliRegistery.entries[key] = self.entry
