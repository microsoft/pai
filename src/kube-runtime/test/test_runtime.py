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
    def test_teamwise_nfs_storage_plugin(self):
        storage_plugin.REST_API_PREFIX = "http://rest-server"
        storage_plugin.USER_NAME = "test-user"
        storage_plugin.USER_TOKEN = "token"
        storage_plugin.JOB_NAME = "job"
        parameters = {"storageConfigNames": ["STORAGE_BJ"]}

        user_config = {
            "username": "test-user",
            "grouplist": ["admingroup"],
            "email": "test-user@microsoft.com",
            "extension": {},
            "admin": True,
            "virtualCluster": ["default", "VC1", "VC2"],
            "storageConfig": ["STORAGE_BJ"]
        }

        storage_config = [
            {
                "name": "STORAGE_BJ",
                "default": True,
                "servers": ["SRV_BJ"],
                "mountInfos": [
                    {
                        "mountPoint": "/data",
                        "path": "data",
                        "server": "SRV_BJ",
                        "permission": "rw"
                    },
                    {
                        "mountPoint": "/home",
                        "path": "users/${PAI_USER_NAME}",
                        "server": "SRV_BJ",
                        "permission": "rw"
                    }
                ]
            }
        ]

        server_config = [
            {
                "spn": "SRV_BJ",
                "type": "nfs",
                "data": {
                    "address": "10.151.41.14",
                    "rootPath": "/data/share/drbdha",
                    "extension": {}
                },
                "extension": {}
            }
        ]

        responses.add(responses.GET, "http://rest-server/api/v2/user/test-user",
                      json=user_config, status=200)
        responses.add(responses.GET, "http://rest-server/api/v2/storage/config/?names=STORAGE_BJ",
                      json=storage_config, status=200)
        responses.add(responses.GET, "http://rest-server/api/v2/storage/server/?names=SRV_BJ",
                      json=server_config, status=200)

        storage_commands = storage_plugin.init_storage_plugin(parameters)
        default_storage_commands = storage_plugin.init_storage_plugin([])

        expect_commands = ["apt-get update",
                           "umask 000",
                           "mkdir --parents /tmp_SRV_BJ_root",
                           "apt-get install --assume-yes nfs-common",
                           "mount -t nfs4 10.151.41.14:/data/share/drbdha /tmp_SRV_BJ_root",
                           "mkdir --parents /data",
                           "mkdir --parents /tmp_SRV_BJ_root/data",
                           "mkdir --parents /home",
                           "mkdir --parents /tmp_SRV_BJ_root/users/${PAI_USER_NAME}",
                           "umount -l /tmp_SRV_BJ_root",
                           "rm -r /tmp_SRV_BJ_root",
                           "mount -t nfs4 10.151.41.14:/data/share/drbdha/data /data",
                           "mount -t nfs4 10.151.41.14:/data/share/drbdha/users/${PAI_USER_NAME} /home"]
        assert storage_commands == "\n".join(expect_commands)
        assert default_storage_commands == "\n".join(expect_commands)

    @responses.activate
    def test_default_teamwise_storage(self):
        pass


if __name__ == '__main__':
    unittest.main()
