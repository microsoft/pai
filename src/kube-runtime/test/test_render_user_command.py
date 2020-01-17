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

import yaml

# pylint: disable=wrong-import-position
sys.path.append(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "../src"))
sys.path.append(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "../src/init.d"))
import user_command_renderer
from common.utils import init_logger
# pylint: enable=wrong-import-position

PACKAGE_DIRECTORY_COM = os.path.dirname(os.path.abspath(__file__))
init_logger()


# pylint: disable=protected-access
class TestUserCommandRender(unittest.TestCase):
    def setUp(self):
        try:
            os.chdir(PACKAGE_DIRECTORY_COM)
        except Exception:  #pylint: disable=broad-except
            pass

    def test_user_command_render(self):
        user_commands = [
            "sleep <% $secrets.time %>", "sleep <% $secrets.time[0] %>",
            "sleep <% $secrets.time.time1 %>",
            "echo <% $secrets.time.date.year %> && sleep <% $secrets.time.date.workingDay.0 %>"
        ]
        expected_commands = [
            "sleep 10", "sleep 10", "sleep 10", "echo 2019 && sleep 1"
        ]
        with open("render_test_secrets.yaml") as f:
            secrets = list(yaml.safe_load_all(f.read()))

        for user_command, expected_command, secret in zip(
                user_commands, expected_commands, secrets):
            res = user_command_renderer._render_user_command(
                user_command, secret)
            self.assertEqual(res, expected_command)


if __name__ == '__main__':
    unittest.main()
