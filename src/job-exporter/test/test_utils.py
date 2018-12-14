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
import subprocess

import base

sys.path.append(os.path.abspath("../src/"))

import utils

class TestUtils(base.TestBase):
    """
    Test utils.py
    """
    def test_walk_json_field_safe(self):
        self.assertIsNone(utils.walk_json_field_safe(None, 1, "abc"))
        self.assertIsNone(utils.walk_json_field_safe([], 1, "abc"))
        self.assertIsNone(utils.walk_json_field_safe([{"abc"}], 1, "abc"))
        self.assertEqual("345",
                utils.walk_json_field_safe([{"name": "123"}, {"name": "345"}], 1, "name"))

    def test_exec_cmd_with_0_return_value(self):
        self.assertEqual("10\n", utils.exec_cmd(["echo", "10"]))

    def test_exec_cmd_with_timeout(self):
        with self.assertRaises(subprocess.TimeoutExpired) as context:
            utils.exec_cmd(["sleep", "10"], timeout=1)

    def test_exec_cmd_with_non_0_return_value(self):
        with self.assertRaises(subprocess.CalledProcessError) as context:
            utils.exec_cmd(["false"])

if __name__ == '__main__':
    unittest.main()
