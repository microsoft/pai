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


import json
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

    def get_mocked_sotrage_config(self, names):
        storage_configs = self.load_json_file("storage_test_config.json")
        return list(filter(lambda config: config["name"] in names, storage_configs))

    def load_json_file(self, file_name):
        with open(file_name) as f:
            return json.load(f)

    @responses.activate
    def test_teamwise_nfs_storage_plugin(self):
        storage_plugin.REST_API_PREFIX = "http://rest-server"
        storage_plugin.USER_NAME = "test-user"
        storage_plugin.USER_TOKEN = "token"
        storage_plugin.JOB_NAME = "job"
        parameters = {"storageConfigNames": ["STORAGE_NFS"]}

        user_config = self.load_json_file("user_test_config.json")
        storage_config = self.get_mocked_sotrage_config(["STORAGE_NFS"])
        server_config = self.load_json_file("storage_server_test_config.json")

        responses.add(responses.GET, "http://rest-server/api/v2/user/test-user",
                      json=user_config, status=200)
        responses.add(responses.GET, "http://rest-server/api/v2/storage/config/?names=STORAGE_NFS",
                      json=storage_config, status=200)
        responses.add(responses.GET, "http://rest-server/api/v2/storage/server/?names=SRV_BJ",
                      json=server_config, status=200)

        storage_commands = storage_plugin.generate_plugin_commands(parameters)

        expect_commands = ["apt-get update",
                           "umask 000",
                           "mkdir --parents /tmp_SRV_BJ_root",
                           "apt-get install --assume-yes nfs-common",
                           "mount -t nfs4 10.151.41.14:/data/share/drbdha /tmp_SRV_BJ_root",
                           "mkdir --parents /mnt/data",
                           "mkdir --parents /tmp_SRV_BJ_root/data",
                           "mkdir --parents /mnt/home",
                           "mkdir --parents /tmp_SRV_BJ_root/users/${PAI_USER_NAME}",
                           "umount -l /tmp_SRV_BJ_root",
                           "rm -r /tmp_SRV_BJ_root",
                           "mount -t nfs4 10.151.41.14:/data/share/drbdha/data /mnt/data",
                           "mount -t nfs4 10.151.41.14:/data/share/drbdha/users/${PAI_USER_NAME} /mnt/home"]
        assert storage_commands == expect_commands

    @responses.activate
    def test_default_storage_plugin(self):
        storage_plugin.REST_API_PREFIX = "http://rest-server"
        storage_plugin.USER_NAME = "test-user"
        storage_plugin.USER_TOKEN = "token"
        storage_plugin.JOB_NAME = "job"

        user_config = self.load_json_file("user_default_storage_test_config.json")
        storage_config = self.get_mocked_sotrage_config(["STORAGE_NFS"])
        storage_configs = self.get_mocked_sotrage_config(["STORAGE_NFS", "STORAGE_TEST"])
        server_config = self.load_json_file("storage_server_test_config.json")

        responses.add(responses.GET, "http://rest-server/api/v2/user/test-user",
                      json=user_config, status=200)
        responses.add(responses.GET, "http://rest-server/api/v2/storage/config/?names=STORAGE_NFS&names=STORAGE_TEST",
                      json=storage_configs, status=200)
        responses.add(responses.GET, "http://rest-server/api/v2/storage/config/?names=STORAGE_NFS",
                      json=storage_config, status=200)
        responses.add(responses.GET, "http://rest-server/api/v2/storage/server/?names=SRV_BJ",
                      json=server_config, status=200)

        default_storage_commands = storage_plugin.generate_plugin_commands([])

        expect_commands = ["apt-get update",
                           "umask 000",
                           "mkdir --parents /tmp_SRV_BJ_root",
                           "apt-get install --assume-yes nfs-common",
                           "mount -t nfs4 10.151.41.14:/data/share/drbdha /tmp_SRV_BJ_root",
                           "mkdir --parents /mnt/data",
                           "mkdir --parents /tmp_SRV_BJ_root/data",
                           "mkdir --parents /mnt/home",
                           "mkdir --parents /tmp_SRV_BJ_root/users/${PAI_USER_NAME}",
                           "umount -l /tmp_SRV_BJ_root",
                           "rm -r /tmp_SRV_BJ_root",
                           "mount -t nfs4 10.151.41.14:/data/share/drbdha/data /mnt/data",
                           "mount -t nfs4 10.151.41.14:/data/share/drbdha/users/${PAI_USER_NAME} /mnt/home"]
        assert default_storage_commands == expect_commands

    @responses.activate
    def test_teamwise_samba_storage_plugin(self):
        storage_plugin.REST_API_PREFIX = "http://rest-server"
        storage_plugin.USER_NAME = "test-user"
        storage_plugin.USER_TOKEN = "token"
        storage_plugin.JOB_NAME = "job"
        parameters = {"storageConfigNames": ["STORAGE_SAMBA"]}

        user_config = self.load_json_file("user_test_config.json")
        storage_config = self.load_json_file("storage_samba_test_config.json")
        server_config = self.load_json_file("storage_samba_test_server_config.json")

        responses.add(responses.GET, "http://rest-server/api/v2/user/test-user",
                      json=user_config, status=200)
        responses.add(responses.GET, "http://rest-server/api/v2/storage/config/?names=STORAGE_SAMBA",
                      json=storage_config, status=200)
        responses.add(responses.GET, "http://rest-server/api/v2/storage/server/?names=samba_test",
                      json=server_config, status=200)

        storage_commands = storage_plugin.generate_plugin_commands(parameters)

        expect_commands = ["apt-get update",
                           "umask 000",
                           "mkdir --parents /tmp_samba_test_root",
                           "apt-get install --assume-yes cifs-utils",
                           "mount -t cifs //10.151.41.14/data/share/drbdha /tmp_samba_test_root" +
                           " -o vers=3.0,username=user,password=password,domain=domain",
                           "mkdir --parents /mnt/data",
                           "mkdir --parents /tmp_samba_test_root/data",
                           "umount -l /tmp_samba_test_root",
                           "rm -r /tmp_samba_test_root",
                           "mount -t cifs //10.151.41.14/data/share/drbdha/data /mnt/data" +
                           " -o vers=3.0,username=user,password=password,domain=domain"]
        assert storage_commands == expect_commands

    @responses.activate
    def test_teamwise_azure_file_storage_plugin(self):
        storage_plugin.REST_API_PREFIX = "http://rest-server"
        storage_plugin.USER_NAME = "test-user"
        storage_plugin.USER_TOKEN = "token"
        storage_plugin.JOB_NAME = "job"
        parameters = {"storageConfigNames": ["STORAGE_AZURE_FILE"]}

        user_config = self.load_json_file("user_test_config.json")
        storage_config = self.load_json_file("storage_azure_file_test_config.json")
        server_config = self.load_json_file("storage_azure_file_test_server_config.json")

        responses.add(responses.GET, "http://rest-server/api/v2/user/test-user",
                      json=user_config, status=200)
        responses.add(responses.GET, "http://rest-server/api/v2/storage/config/?names=STORAGE_AZURE_FILE",
                      json=storage_config, status=200)
        responses.add(responses.GET, "http://rest-server/api/v2/storage/server/?names=azure_file_test",
                      json=server_config, status=200)

        storage_commands = storage_plugin.generate_plugin_commands(parameters)

        expect_commands = ["apt-get update",
                           "umask 000",
                           "mkdir --parents /tmp_azure_file_test_root",
                           "apt-get install --assume-yes cifs-utils",
                           "mount -t cifs //datastore/fileshare /tmp_azure_file_test_root" +
                           " -o vers=3.0,username=accountname,password=key,dir_mode=0777,file_mode=0777,serverino",
                           "mkdir --parents /mnt/data",
                           "mkdir --parents /tmp_azure_file_test_root/data",
                           "umount -l /tmp_azure_file_test_root",
                           "rm -r /tmp_azure_file_test_root",
                           "mount -t cifs //datastore/fileshare/data /mnt/data" +
                           " -o vers=3.0,username=accountname,password=key,dir_mode=0777,file_mode=0777,serverino"]
        assert storage_commands == expect_commands

    @responses.activate
    def test_teamwise_azure_blob_storage_plugin(self):
        storage_plugin.REST_API_PREFIX = "http://rest-server"
        storage_plugin.USER_NAME = "test-user"
        storage_plugin.USER_TOKEN = "token"
        storage_plugin.JOB_NAME = "job"
        parameters = {"storageConfigNames": ["STORAGE_AZURE_BLOB"]}

        user_config = self.load_json_file("user_test_config.json")
        storage_config = self.load_json_file("storage_azure_blob_test_config.json")
        server_config = self.load_json_file("storage_azure_blob_test_server_config.json")

        responses.add(responses.GET, "http://rest-server/api/v2/user/test-user",
                      json=user_config, status=200)
        responses.add(responses.GET, "http://rest-server/api/v2/storage/config/?names=STORAGE_AZURE_BLOB",
                      json=storage_config, status=200)
        responses.add(responses.GET, "http://rest-server/api/v2/storage/server/?names=azure_blob_test",
                      json=server_config, status=200)

        storage_commands = storage_plugin.generate_plugin_commands(parameters)

        expect_commands = ["apt-get update",
                           "umask 000",
                           "apt-get install --assume-yes wget curl lsb-release apt-transport-https",
                           "valid_release=('14.04' '15.10' '16.04' '16.10' '17.04' '17.10' '18.04' '18.10' '19.04')",
                           "release=`lsb_release -r | cut -f 2`",
                           "if [[ ! ${valid_release[@]} =~ ${release} ]];" +
                           " then echo \"Invalid OS version for Azureblob!\"; exit 1; fi",
                           "wget https://packages.microsoft.com/config/ubuntu/${release}/packages-microsoft-prod.deb",
                           "dpkg -i packages-microsoft-prod.deb",
                           "apt-get update",
                           "apt-get install --assume-yes blobfuse fuse",
                           "mkdir --parents /mnt/resource/blobfusetmp/azure_blob_test",
                           "echo \"accountName accountname\" >> /azure_blob_test.cfg",
                           "echo \"accountKey key\" >> /azure_blob_test.cfg",
                           "echo \"containerName containername\" >> /azure_blob_test.cfg",
                           "chmod 600 /azure_blob_test.cfg",
                           "mkdir --parents /tmp_azure_blob_test_root",
                           "blobfuse /tmp_azure_blob_test_root --tmp-path=/mnt/resource/blobfusetmp/azure_blob_test" +
                           " --config-file=/azure_blob_test.cfg -o attr_timeout=240" +
                           " -o entry_timeout=240 -o negative_timeout=120",
                           "mkdir --parents /mnt/data",
                           "mkdir --parents /tmp_azure_blob_test_root/data",
                           "rm -r /mnt/data",
                           "ln -s /tmp_azure_blob_test_root/data /mnt/data"]
        assert storage_commands == expect_commands


if __name__ == '__main__':
    unittest.main()
