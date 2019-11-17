# Copyright (c) Microsoft Corporation
# All rights reserved.
#
# MIT License
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
# documentation files (the "Software"), to deal in the Software without restriction, including without limitation
# the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
# to permit persons to whom the Software is furnished to do so, subject to the following conditions:
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
# BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
# DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


import os
import sys
import unittest

import requests
import responses
import yaml

#pylint: disable=wrong-import-position
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../src/init.d"))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../src/plugins"))

from initializer import init_plugins
import teamwise_storage.init as storage_plugin

#pylint: enable=wrong-import-position

PACKAGE_DIRECTORY_COM = os.path.dirname(os.path.abspath(__file__))

class TestRuntimeInitializer(unittest.TestCase):

    def setUp(self):
        try:
            os.chdir(PACKAGE_DIRECTORY_COM)
        except OSError:
            pass

    def test_cmd_plugin(self):
        job_path = "cmd_test_job.yaml"
        if os.path.exists(job_path):
            with open(job_path, 'rt') as f:
                jobconfig = yaml.load(f, Loader=yaml.SafeLoader)
        commands = [[], []]
        init_plugins(jobconfig, commands, "../src/plugins", ".", "worker")

    def test_ssh_plugin(self):
        job_path = "ssh_test_job.yaml"
        if os.path.exists(job_path):
            with open(job_path, 'rt') as f:
                jobconfig = yaml.load(f, Loader=yaml.SafeLoader)
        commands = [[], []]
        init_plugins(jobconfig, commands, "../src/plugins", ".", "worker")

    def test_ssh_plugin_barrier(self):
        job_path = "sshbarrier_test_job.yaml"
        if os.path.exists(job_path):
            with open(job_path, 'rt') as f:
                jobconfig = yaml.load(f, Loader=yaml.SafeLoader)
        commands = [[], []]
        init_plugins(jobconfig, commands, "../src/plugins", ".", "master")
        commands = [[], []]
        init_plugins(jobconfig, commands, "../src/plugins", ".", "worker")

    @responses.activate
    def test_teamwise_storage_plugin(self):
        responses.add(responses.GET, 'http://twitter.com/api/1/foobar',
                      json={'error': 'not found'}, status=404)

        resp = requests.get('http://twitter.com/api/1/foobar')
        assert resp.json() == {"error": "not found"}


if __name__ == '__main__':
    unittest.main()
