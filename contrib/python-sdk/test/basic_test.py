import os
import unittest
from shutil import rmtree
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
            rmtree(dir_name, ignore_errors=True)
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
