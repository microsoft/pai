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
import sys
import unittest


in_place_chaning = False


class TestFormat(unittest.TestCase):

    folders = [os.path.join('..', 'openpaisdk'), '.']

    def test_format(self):
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

    def clear_notebook_output(self):
        folders = [
            os.path.join('..', 'examples'),
            os.path.join('..', '..', 'notebook-extension', 'examples'),
        ]
        for folder in folders:
            root, dirs, files = next(os.walk(folder))
            for file in [fn for fn in files if fn.endswith('.ipynb')]:
                src = os.path.join(folder, file)
                print(src)
                os.system(f"jupyter nbconvert --ClearOutputPreprocessor.enabled=True --inplace {src}")
                os.system(f"dos2unix {src}")


if __name__ == '__main__':
    in_place_chaning = True
    TestFormat().test_format()
    TestFormat().clear_notebook_output()
