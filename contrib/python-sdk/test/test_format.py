import os
import sys
from subprocess import check_output as run
import unittest
from openpaisdk.io_utils import to_screen


in_place_chaning = False


class TestFormat(unittest.TestCase):

    folders = [os.path.join('..', 'openpaisdk')]

    def test_format(self):
        from openpaisdk.io_utils import listdir
        for folder in self.folders:
            root, dirs, files = next(os.walk(folder))
            for src in [fn for fn in files if fn.endswith(".py")]:
                os.system(' '.join([
                    sys.executable, '-m', 'autoflake',
                    '--remove-unused-variables',
                    '--remove-all-unused-imports',
                    '--remove-duplicate-keys',
                    '--ignore-init-module-imports',
                    '-i' if in_place_chaning else '',
                    os.path.join(folder, src)
                ]))


if __name__ == '__main__':
    in_place_chaning = True
    TestFormat().test_format()
