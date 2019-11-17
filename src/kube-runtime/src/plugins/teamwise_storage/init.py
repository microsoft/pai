#!/usr/bin/env python
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

import http
import logging
import os
import re
import sys

import requests

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from plugin_utils import plugin_init, inject_commands

logging.basicConfig(
    format="%(asctime)s - %(levelname)s - %(filename)s:%(lineno)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

# REST_API_PREFIX = os.environ.get("PAI_REST_SERVER_URI")
# USER_TOKEN = os.environ.get("PAI_USER_TOKEN")
# USER_NAME = os.environ.get("PAI_USER_NAME")
# JOB_NAME = os.environ.get("PAI_JOB_NAME")
STORAGE_PRE_COMMAND = ["apt-get update", "umask 000"]
REST_API_PREFIX = "http://10.151.40.4:9186"
USER_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImJpbnlsaSIsImFwcGxpY2F0aW9uIjpmYWxzZSwiaWF0IjoxNTczNjMzMTQ0LCJleHAiOjE1NzQyMzc5NDR9.gMQ0zgqh_0BrLm3Tcviwgubq9jMG0TKLTz8ZRZJ-UsA"
USER_NAME = "binyli"
JOB_NAME = "job"


def http_get(url) -> requests.Response:
    logger.info("Send get request with url %s", url)
    return requests.get(url, headers={'Authorization': USER_TOKEN})


def is_valid_storage_config(user_storage_config, storage_config_names) -> bool:
    for storage_config in storage_config_names:
        if storage_config not in user_storage_config:
            return False
    return True


def generate_commands(storage_config_names) -> list:
    query_string = "&".join(
        list(map(lambda name: "names={}".format(name), storage_config_names)))
    resp = http_get(
        "{}/api/v2/storage/config/?{}".format(REST_API_PREFIX, query_string))
    if resp.status_code != http.HTTPStatus.OK:
        logger.error(
            "Failed to get storage config from rest-server %s", resp.text)
        raise Exception("Generate commands faield")
    storage_configs = resp.json()

    servers_name = set([
        mount_info["server"] for storage_config in storage_configs for mount_info in storage_config["mountInfos"]])

    query_string = "&".join(
        list(map(lambda name: "names={}".format(name), servers_name)))
    resp = http_get(
        "{}/api/v2/storage/server/?{}".format(REST_API_PREFIX, query_string))
    if resp.status_code != http.HTTPStatus.OK:
        logger.error(
            "Failed to get storage servers config from rest-server %s", resp.text)
        raise Exception("Generate commands faield")
    servers_configs = resp.json()

    return generate_storage_command(storage_configs, servers_configs)


def generate_storage_command(storage_configs, servers_configs) -> list:
    mount_commands = []
    server_mount_dict = {}
    mount_points = []
    for config in storage_configs:
        for mount_info in config["mountInfos"]:
            if mount_info["server"] in server_mount_dict:
                server_mount_dict[mount_info["server"]].append(mount_info)
            else:
                server_mount_dict[mount_info["server"]] = [mount_info]

    for spn in server_mount_dict:
        mount_infos = server_mount_dict[spn]
        server_config = next(
            (conf for conf in servers_configs if conf["spn"] == spn), None)
        if not server_config:
            logger.error("Failed to get server config: %s", spn)
            raise Exception("Generate mount command failed")

        validate_mount_point(mount_points, mount_infos)

        # 1. generate prepare command for storage
        tmp_folder = "/tmp_{}_root".format(spn)
        premount_commands = generate_premount_command(server_config, tmp_folder)

        # 2. mount root folder and make sub directories
        first_round_mount_commands = generate_mount_command(server_config, tmp_folder, "", tmp_folder)

        mkdir_commands = list(map(lambda mount_info: [
                             "mkdir --parents {}".format(mount_info["mountPoint"]),
                             "mkdir --parents {}".format(normalize_path(tmp_folder + mount_info["path"]))],
                             mount_infos))
        mkdir_commands = [command for mkdir_command in mkdir_commands for command in mkdir_command]

        # 3. clean 1st round mount
        post_mount_command = generate_post_mount_command(server_config, tmp_folder)

        # 4. generate real mount command
        second_round_mount_commands = list(map(
            lambda mount_info: generate_mount_command(server_config,
                                                      mount_info["mountPoint"],
                                                      mount_info["path"],
                                                      tmp_folder),
            mount_infos))
        second_round_mount_commands = [
            command for mount_command in second_round_mount_commands for command in mount_command]

        # 5 assemble all commands
        mount_commands.extend(premount_commands + first_round_mount_commands +
                              mkdir_commands + post_mount_command + second_round_mount_commands)

    return mount_commands


def validate_mount_point(mount_points, mount_infos) -> None:
    for moun_info in mount_infos: 
        # Check duplicated mount points
        if moun_info["mountPoint"] in mount_points:
            raise Exception(
                "Mount point error! More than one mount point [" +
                  moun_info["mountPoint"] + "]!")
        mount_points.append(moun_info["mountPoint"])


def generate_premount_command(server_config, tmp_folder) -> list:
    server_type = server_config["type"]
    if server_type == "nfs":
        ret = [
          "mkdir --parents {}".format(tmp_folder),
          "apt-get install --assume-yes nfs-common",
        ]
        return ret
    if server_type == "samba":
        ret = [
          "mkdir --parents {}".format(tmp_folder),
          "apt-get install --assume-yes cifs-utils",
        ]
        return ret
    if server_type == "azurefile":
         pass
    if server_type == "azureblob":
        pass
    if server_type == "hdfs":
        pass
    raise Exception("Unsupported storage type {}".format(server_type))


def generate_mount_command(server_config, mount_point, relative_path, tmp_folder) -> list:
    server_type = server_config["type"]
    server_data = server_config["data"]
    if server_type == "nfs":
        return [
            "mount -t nfs4 ${}:".format(server_data["address"]) + 
            normalize_path(server_data["rootPath"] + '/' + relative_path) + 
            " {}".format(mount_point)
        ]
    raise Exception("Unsupported storage type {}".format(server_type))


def generate_post_mount_command(server_config, tmp_folder) -> list:
    server_type = server_config["type"]
    if server_type == "nfs" or server_type == "samba" or server_type == "azurefile":
        return ["umount -l {}".format(tmp_folder), "rm -r {}".format(tmp_folder)]
    raise Exception("Unsupported storage type {}".format(server_type))


def normalize_path(ori_path) -> str:
    normalized_path = re.compile("%USER", re.IGNORECASE).sub(USER_NAME, ori_path)
    normalized_path = re.compile("%JOB", re.IGNORECASE).sub(JOB_NAME, normalized_path)
    return normalized_path.replace("//", "/")


def init_storage_plugin(parameters):
    resp = http_get("{}/api/v2/user/{}".format(REST_API_PREFIX, USER_NAME))
    if resp.status_code != http.HTTPStatus.OK:
        logger.error("Failed to get user config, resp: %s", resp.text)
        sys.exit(1)

    user_config = resp.json()
    if not user_config["storageConfig"]:
        logger.error(
            "User %s don't has the permission to access storage", USER_NAME)
        sys.exit(1)

    user_storage_config = user_config["storageConfig"]
    if parameters is None or parameters["storageConfigNames"] is None:
        # try to mount default storage
        sys.exit(0)

    storage_config_names = parameters["storageConfigNames"]
    if not is_valid_storage_config(user_storage_config, storage_config_names):
        logger.error("User %s do not has permission to access storages: %s",
                     USER_NAME, storage_config_names)
        sys.exit(1)

    storage_config_names = parameters["storageConfigNames"]
    storage_commands = generate_commands(storage_config_names)
    seperator = "\n\n"
    return seperator.join(STORAGE_PRE_COMMAND + storage_commands)


if __name__ == "__main__":
    logger.info("Preparing storage runtime plugin commands")
    # [parameters, pre_script, post_script] = plugin_init()
    parameters = {"storageConfigNames": ["STORAGE_BJ"]}
    pre_script_commands = init_storage_plugin(parameters)
    inject_commands(pre_script_commands, pre_script)

    logger.info("Storage runtime plugin perpared")
