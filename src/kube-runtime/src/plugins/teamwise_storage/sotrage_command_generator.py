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

import base64
import json
import logging
import os

from kubernetes import config as kube_config, client as kube_client

from .storage_helper import StorageHelper

LOGGER = logging.getLogger(__name__)

USER_NAME = os.environ.get("PAI_USER_NAME")
JOB_NAME = os.environ.get("PAI_JOB_NAME")
STORAGE_CONFIGS = os.environ.get("SOTRAGE_CONFIGS")
KUBE_APISERVER_ADDRESS = os.environ.get("KUBE_APISERVER_ADDRESS")

KUBE_TOKEN_FILE = "/var/run/secrets/kubernetes.io/serviceaccount/token"

STORAGE_PRE_COMMAND = ["apt-get update", "umask 000"]


class StorageCommandGenerator:
    def __init__(self):
        if not os.path.isfile(KUBE_TOKEN_FILE):
            # Not enable RBAC
            if not KUBE_APISERVER_ADDRESS:
                LOGGER.error("could not get kubernetes api server address")
                raise ValueError("KUBE_APISERVER_ADDRESS is none")
            config = kube_client.Configuration()
            config.host = os.environ.get("KUBE_APISERVER_ADDRESS")
            self._api_client = kube_client.ApiClient(config)
        else:
            kube_config.load_incluster_config()
            self._api_client = None

    def _get_storage_configs(self, storage_config_names):
        storage_config_secrets = kube_client.CoreV1Api(
            self._api_client).read_namespaced_secret("storage-config",
                                                     "pai-storage",
                                                     timeout_seconds=10)
        secrets_data = storage_config_secrets.data
        secrets_value = [secrets_data[name] for name in storage_config_names]
        storage_configs = list(
            map(lambda secret: json.loads(base64.b64decode(secret).decode()),
                secrets_value))
        return storage_configs

    def _get_user_default_storage_config_names(self, user_storage_config_names
                                               ) -> list:
        storage_configs = self._get_storage_configs(user_storage_config_names)
        return list(
            map(lambda config: config["name"],
                filter(lambda config: config["default"], storage_configs)))

    def _covert_secret_to_server_config(self, secret):
        data = json.loads(base64.b64decode(secret).decode())
        return {"spn": data["spn"], "type": data["type"], "data": data}

    def _generate_commands(self, storage_config_names) -> list:
        storage_configs = self._get_storage_configs(storage_config_names)

        server_names = {
            mount_info["server"]
            for storage_config in storage_configs
            for mount_info in storage_config["mountInfos"]
        }

        storage_server_secrets = kube_client.CoreV1Api(
            self._api_client).read_namespaced_secret("storage-config",
                                                     "storage-server",
                                                     timeout_seconds=10)
        secrets_data = storage_server_secrets.data
        secrets_value = [secrets_data[name] for name in server_names]
        servers_configs = list(
            map(self._covert_secret_to_server_config, secrets_value))

        return self._generate_mount_commands(storage_configs, servers_configs)

    def _generate_mount_commands(self, storage_configs,
                                 servers_configs) -> list:
        mount_commands = []
        mount_points = []
        storage_helper = StorageHelper(USER_NAME, JOB_NAME)
        server_mount_dict = StorageHelper.perpare_server_mount_dict(
            storage_configs)

        for spn in server_mount_dict:
            mount_infos = server_mount_dict[spn]
            server_config = next(
                (conf for conf in servers_configs if conf["spn"] == spn), None)
            if not server_config:
                LOGGER.error("Failed to get server config: %s", spn)
                raise Exception("Generate mount commands failed")

            StorageHelper.validate_mount_point(mount_points, mount_infos)

            # 1. generate prepare command for storage
            tmp_folder = "/tmp_{}_root".format(spn)
            premount_commands = storage_helper.get_setup_command(
                server_config, tmp_folder, phrase="pre_mount")

            # 2. mount root folder and make sub directories
            first_round_mount_commands = storage_helper.get_setup_command(
                server_config, tmp_folder, phrase="tmp_mount")
            mkdir_commands = storage_helper.generate_make_tmp_folder_command(
                tmp_folder, mount_infos)

            # 3. clean 1st round mount
            post_mount_commands = storage_helper.get_setup_command(
                server_config, tmp_folder, phrase="post_mount")

            # 4. generate real mount command
            second_round_mount_commands = list(
                map(
                    lambda mount_info, config=server_config, pre_mounted_dir=
                    tmp_folder: storage_helper.get_setup_command(  # pylint: disable=bad-continuation
                        config,
                        mount_info["mountPoint"],
                        phrase="real_mount",
                        relative_path=mount_info["path"],
                        pre_mounted_dir=pre_mounted_dir),
                    mount_infos))

            second_round_mount_commands = [
                command for mount_command in second_round_mount_commands
                for command in mount_command
            ]

            # 5 assemble all commands
            mount_commands.extend(premount_commands +
                                  first_round_mount_commands + mkdir_commands +
                                  post_mount_commands +
                                  second_round_mount_commands)

        return mount_commands

    def generate_plugin_commands(self, parameters) -> list:
        try:
            user_storage_config = json.loads(STORAGE_CONFIGS)
        except json.JSONDecodeError:
            LOGGER.exception("storage config is invalid")
            raise

        if not user_storage_config:
            LOGGER.error("User %s don't has the permission to access storage",
                         USER_NAME)
            raise RuntimeError("Not has permission to access storage")

        if not parameters or not parameters["storageConfigNames"]:
            default_storage_configs = self._get_user_default_storage_config_names(
                user_storage_config)
            if not default_storage_configs:
                LOGGER.error(
                    "Not set default stroage config for user %s, please contect admin",
                    USER_NAME)
                raise RuntimeError("Not set default stroage")
            storage_config_names = default_storage_configs
        else:
            storage_config_names = parameters["storageConfigNames"]
            if not StorageHelper.is_valid_storage_config(
                    user_storage_config, storage_config_names):
                LOGGER.error(
                    "User %s do not has permission to access storages: %s",
                    USER_NAME, storage_config_names)
                raise RuntimeError("Not has permission to access storage")

        return STORAGE_PRE_COMMAND + self._generate_commands(
            storage_config_names)
