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
from unittest import mock
import yaml

#pylint: disable=wrong-import-position
sys.path.append(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "../src"))
sys.path.append(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "../src/init.d"))

from common.utils import init_logger
import initializer
from plugins.teamwise_storage import storage_command_generator
from plugins.plugin_utils import PluginHelper

#pylint: enable=wrong-import-position

PACKAGE_DIRECTORY_COM = os.path.dirname(os.path.abspath(__file__))


# pylint: disable=no-self-use, protected-access
class TestRuntime(unittest.TestCase):
    def setUp(self):
        init_logger()
        try:
            os.chdir(PACKAGE_DIRECTORY_COM)
        except OSError:
            pass
        # pylint: disable=line-too-long
        storage_command_generator.USER_NAME = "test-user"
        storage_command_generator.JOB_NAME = "job"
        storage_command_generator.STORAGE_CONFIGS = "[\"STORAGE_NFS\", \"STORAGE_TEST\", \"STORAGE_SAMBA\", \"STORAGE_AZURE_FILE\", \"STORAGE_AZURE_BLOB\"]"
        storage_command_generator.KUBE_APISERVER_ADDRESS = "http://api_server_url:8080"

    def test_cmd_plugin(self):
        job_path = "cmd_test_job.yaml"
        if os.path.exists(job_path):
            with open(job_path, 'rt') as f:
                jobconfig = yaml.safe_load(f)
        commands = [[], []]
        initializer.init_plugins(jobconfig, commands, "../src/plugins", ".",
                                 "worker")

    def test_ssh_plugin(self):
        job_path = "ssh_test_job.yaml"
        if os.path.exists(job_path):
            with open(job_path, 'rt') as f:
                jobconfig = yaml.safe_load(f)
        commands = [[], []]
        initializer.init_plugins(jobconfig, commands, "../src/plugins", ".",
                                 "worker")

    def test_ssh_plugin_barrier(self):
        job_path = "sshbarrier_test_job.yaml"
        if os.path.exists(job_path):
            with open(job_path, 'rt') as f:
                jobconfig = yaml.safe_load(f)
        commands = [[], []]
        initializer.init_plugins(jobconfig, commands, "../src/plugins", ".",
                                 "master")
        commands = [[], []]
        initializer.init_plugins(jobconfig, commands, "../src/plugins", ".",
                                 "worker")

    def test_plugin_prune(self):
        os.environ["GANG_ALLOCATION"] = "false"
        job_path = "gang_ssh_conflict.yaml"
        if os.path.exists(job_path):
            with open(job_path, "r") as f:
                job_config = yaml.safe_load(f)
        pruned_config = initializer._prune_plugins(job_config)
        self.assertEqual(
            pruned_config["extras"]["com.microsoft.pai.runtimeplugin"],
            [{
                'plugin': 'tensorboard'
            }])

    def load_json_file(self, file_name):
        with open(file_name) as f:
            return json.load(f)

    def get_secret(self, config_name, _):
        secret = mock.Mock()
        if config_name == "storage-config":
            resp = self.load_json_file("storage_test_config.json")
            secret.data = resp["data"]
            return secret
        if config_name == "storage-server":
            resp = self.load_json_file("storage_test_server.json")
            secret.data = resp["data"]
            return secret
        return None

    @mock.patch("kubernetes.client.CoreV1Api.read_namespaced_secret")
    def test_teamwise_nfs_storage_plugin(self, mock_get_secrets):
        mock_get_secrets.side_effect = self.get_secret

        parameters = {"storageConfigNames": ["STORAGE_NFS"]}
        command_generator = storage_command_generator.StorageCommandGenerator()
        storage_commands = command_generator.generate_plugin_commands(
            parameters)

        expect_commands = [
            "apt-get update", "umask 000", "mkdir --parents /tmp_SRV_BJ_root",
            "apt-get install --assume-yes nfs-common",
            "mount -t nfs4 10.151.41.14:/data/share/drbdha /tmp_SRV_BJ_root",
            "mkdir --parents /mnt/data",
            "mkdir --parents /tmp_SRV_BJ_root/data",
            "mkdir --parents /mnt/home",
            "mkdir --parents /tmp_SRV_BJ_root/users/${PAI_USER_NAME}",
            "umount -l /tmp_SRV_BJ_root", "rm -r /tmp_SRV_BJ_root",
            "mount -t nfs4 10.151.41.14:/data/share/drbdha/data /mnt/data",
            "mount -t nfs4 10.151.41.14:/data/share/drbdha/users/${PAI_USER_NAME} /mnt/home"
        ]
        assert storage_commands == expect_commands

    @mock.patch("kubernetes.client.CoreV1Api.read_namespaced_secret")
    def test_default_storage_plugin(self, mock_get_secrets):
        mock_get_secrets.side_effect = self.get_secret
        command_generator = storage_command_generator.StorageCommandGenerator()
        default_storage_commands = command_generator.generate_plugin_commands(
            [])

        expect_commands = [
            "apt-get update", "umask 000", "mkdir --parents /tmp_SRV_BJ_root",
            "apt-get install --assume-yes nfs-common",
            "mount -t nfs4 10.151.41.14:/data/share/drbdha /tmp_SRV_BJ_root",
            "mkdir --parents /mnt/data",
            "mkdir --parents /tmp_SRV_BJ_root/data",
            "mkdir --parents /mnt/home",
            "mkdir --parents /tmp_SRV_BJ_root/users/${PAI_USER_NAME}",
            "umount -l /tmp_SRV_BJ_root", "rm -r /tmp_SRV_BJ_root",
            "mount -t nfs4 10.151.41.14:/data/share/drbdha/data /mnt/data",
            "mount -t nfs4 10.151.41.14:/data/share/drbdha/users/${PAI_USER_NAME} /mnt/home"
        ]
        assert default_storage_commands == expect_commands

    @mock.patch("kubernetes.client.CoreV1Api.read_namespaced_secret")
    def test_teamwise_samba_storage_plugin(self, mock_get_secrets):
        parameters = {"storageConfigNames": ["STORAGE_SAMBA"]}
        mock_get_secrets.side_effect = self.get_secret
        command_generator = storage_command_generator.StorageCommandGenerator()
        storage_commands = command_generator.generate_plugin_commands(
            parameters)

        expect_commands = [
            "apt-get update", "umask 000",
            "mkdir --parents /tmp_samba_test_root",
            "apt-get install --assume-yes cifs-utils",
            "mount -t cifs //10.151.41.14/data/share/drbdha /tmp_samba_test_root"
            + " -o vers=3.0,username=user,password=password,domain=domain",
            "mkdir --parents /mnt/data",
            "mkdir --parents /tmp_samba_test_root/data",
            "umount -l /tmp_samba_test_root", "rm -r /tmp_samba_test_root",
            "mount -t cifs //10.151.41.14/data/share/drbdha/data /mnt/data" +
            " -o vers=3.0,username=user,password=password,domain=domain"
        ]
        assert storage_commands == expect_commands

    @mock.patch("kubernetes.client.CoreV1Api.read_namespaced_secret")
    def test_teamwise_azure_file_storage_plugin(self, mock_get_secrets):
        parameters = {"storageConfigNames": ["STORAGE_AZURE_FILE"]}
        mock_get_secrets.side_effect = self.get_secret
        command_generator = storage_command_generator.StorageCommandGenerator()
        storage_commands = command_generator.generate_plugin_commands(
            parameters)

        expect_commands = [
            "apt-get update", "umask 000",
            "mkdir --parents /tmp_azure_file_test_root",
            "apt-get install --assume-yes cifs-utils",
            "mount -t cifs //datastore/fileshare /tmp_azure_file_test_root" +
            " -o vers=3.0,username=accountname,password=key,dir_mode=0777,file_mode=0777,serverino",
            "mkdir --parents /mnt/data",
            "mkdir --parents /tmp_azure_file_test_root/data",
            "umount -l /tmp_azure_file_test_root",
            "rm -r /tmp_azure_file_test_root",
            "mount -t cifs //datastore/fileshare/data /mnt/data" +
            " -o vers=3.0,username=accountname,password=key,dir_mode=0777,file_mode=0777,serverino"
        ]
        assert storage_commands == expect_commands

    @mock.patch("kubernetes.client.CoreV1Api.read_namespaced_secret")
    def test_teamwise_azure_blob_storage_plugin(self, mock_get_secrets):
        parameters = {"storageConfigNames": ["STORAGE_AZURE_BLOB"]}
        mock_get_secrets.side_effect = self.get_secret
        command_generator = storage_command_generator.StorageCommandGenerator()
        storage_commands = command_generator.generate_plugin_commands(
            parameters)

        expect_commands = [
            "apt-get update", "umask 000",
            "apt-get install --assume-yes wget curl lsb-release apt-transport-https",
            "valid_release=('14.04' '15.10' '16.04' '16.10' '17.04' '17.10' '18.04' '18.10' '19.04')",
            "release=`lsb_release -r | cut -f 2`",
            "if [[ ! ${valid_release[@]} =~ ${release} ]];" +
            " then echo \"Invalid OS version for Azureblob!\"; exit 1; fi",
            "wget https://packages.microsoft.com/config/ubuntu/${release}/packages-microsoft-prod.deb",
            "dpkg -i packages-microsoft-prod.deb", "apt-get update",
            "apt-get install --assume-yes blobfuse fuse",
            "mkdir --parents /mnt/resource/blobfusetmp/azure_blob_test",
            "echo \"accountName accountname\" >> /azure_blob_test.cfg",
            "echo \"accountKey key\" >> /azure_blob_test.cfg",
            "echo \"containerName containername\" >> /azure_blob_test.cfg",
            "chmod 600 /azure_blob_test.cfg",
            "mkdir --parents /tmp_azure_blob_test_root",
            "blobfuse /tmp_azure_blob_test_root --tmp-path=/mnt/resource/blobfusetmp/azure_blob_test"
            + " --config-file=/azure_blob_test.cfg -o attr_timeout=240" +
            " -o entry_timeout=240 -o negative_timeout=120",
            "mkdir --parents /mnt/data",
            "mkdir --parents /tmp_azure_blob_test_root/data",
            "rm -r /mnt/data", "ln -s /tmp_azure_blob_test_root/data /mnt/data"
        ]
        assert storage_commands == expect_commands

    def test_plugin_failure_policy(self):
        test_script_file = "test.sh"
        if os.path.exists(test_script_file):
            os.remove(test_script_file)

        with open("plugin_with_failure_policy.yaml", 'r') as f:
            plugins = list(yaml.safe_load_all(f))
            helpers = list(map(PluginHelper, plugins))
            self.assertEqual(helpers[0]._failure_policy, "ignore")
            self.assertEqual(helpers[1]._failure_policy, "fail")
            self.assertEqual(helpers[2]._failure_policy, "fail")

            helpers[0].inject_commands(["test"], test_script_file)
            with open(test_script_file) as f:
                lines = f.read().splitlines()
                first_line = lines[0]
                last_line = lines[-1]
                self.assertEqual(first_line, "set +o errexit")
                self.assertEqual(last_line, "set -o errexit")
            os.remove(test_script_file)


if __name__ == '__main__':
    unittest.main()
