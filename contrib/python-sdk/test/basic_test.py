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


import os
import unittest
from typing import Union
from openpaisdk.io_utils import to_screen, safe_chdir


def seperated(method):
    "run the each test in a separated directory"
    def func(*args, **kwargs):
        dir_name = 'utdir_' + method.__name__
        os.makedirs(dir_name, exist_ok=True)
        try:
            with safe_chdir(dir_name):
                method(*args, **kwargs)
        except Exception as identifier:
            raise identifier
        finally:
            to_screen(f"trying to remove {dir_name}")
            # ! rmtree not work on windows
            os.system(f'rm -rf {dir_name}')
    return func


class OrderedUnitTestCase(unittest.TestCase):

    def get_steps(self):
        for name in dir(self):  # dir() result is implicitly sorted
            if name.lower().startswith("step"):
                yield name, getattr(self, name)

    def run_steps(self):
        for name, func in self.get_steps():
            try:
                to_screen(f"\n==== begin to test {name} ====")
                func()
            except Exception as identifier:
                self.fail("test {} failed ({}: {})".format(name, type(identifier), repr(identifier)))

    def cmd_exec(self, cmds: Union[list, str]):
        if isinstance(cmds, list):
            cmds = ' '.join(cmds)
        print(cmds)
        exit_code = os.system(cmds)
        self.assertEqual(exit_code, 0, f"fail to run {cmds}")
