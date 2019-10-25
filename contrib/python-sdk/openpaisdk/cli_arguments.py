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


class ArgumentFactory:

    def __init__(self):
        self.factory = dict()

        # deal with predefined defaults
        for name, params in LayeredSettings.definitions.items():
            args = ['--' + name]
            abbr = params.get('abbreviation', None)
            if abbr:  # args = ['--{name}', '-{abbr}' or '--{abbr}']
                args += [('-' if len(abbr) == 1 else '--') + abbr]
            kwargs = {k: v for k, v in params.items() if k not in ["name", "abbreviation"]}
            kwargs["default"] = LayeredSettings.get(name)
            self.add_argument(*args, **kwargs)

        # cluster
        self.add_argument('cluster_alias', help='cluster alias to select')

        self.add_argument('--pai-uri', help="uri of openpai cluster, in format of http://x.x.x.x")
        self.add_argument('--user', help='username')
        self.add_argument('--password', help="password")
        self.add_argument('--authen-token', '--token', dest='token', help="authentication token")

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
        self.add_argument('--notebook-token', '--token', dest='token', default="abcd",
                          help='jupyter notebook authentication token')
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
