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
import sys

import requests
import yaml

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from plugin_utils import plugin_init, inject_commands

logger = logging.getLogger(__name__)

REST_API_PREFIX = os.environ.get("PAI_REST_SERVER_URI")"


def is_valid_storage_config(user_storage_config, storage_config_names):
    for user_config in user_storage_config:
        if user_config not in storage_config_names:
            return False
    return True


def generate_commands(storage_config_names):
    query_string = "&".join(list(map(lambda name: "names={}".format(name), storage_config_names)))
    resp = requests.get("{}/api/v2/storage/config/?{}".format(query_string))
    if resp.status_code != http.HTTPStatus.OK:
        logger.error("Failed to get storage config from rest-server", resp)
        raise Exception("Generate commands faield")
    storage_configs = resp.json()

    server_list = list(map(lambda config: config.servers), storage_configs)
    servers_name = [item for sublist in server_list for item in sublist]

    query_string = "&".join(list(map(lambda name: "names={}".format(name), servers_name)))
    resp = requests.get("{}/api/v2/storage/server/?{}".format(query_string))
    if resp.status_code != http.HTTPStatus.OK:
        logger.error("Failed to get storage servers config from rest-server", resp)
        raise Exception("Generate commands faield")
    servers_config = resp.json()

    return list(map(lambda config: generage_storage_command(config, servers_config), storage_configs))


def generage_storage_command(storage_config, servers_config):
    mount_commands = ""
    for mount in storage_config.mountInfos:
        server_config = next(conf for conf in servers_config if conf.spn == mount.spn)
        if server_config.type == "nfs":
            pass
    return mount_commands


if __name__ == "__main__":
    [parameters, pre_script, post_script] = plugin_init()

    commands = []
    user_name = os.environ.get("PAI_USER")
    user_token = os.environ.get("PAI_USER_TOKEN")

    resp = requests.get("{}/api/v2/user/binyli".format(REST_API_PREFIX), headers={'Authorization': user_token})
    if resp.status_code != http.HTTPStatus.OK:
        logger.error("Failed to get user config, resp: %s", resp.text)
        sys.exit(1)

    user_config = resp.json()
    if not user_config.storageConfig:
        logger.error("User %s don't has the permission to access storage", user_name)
        sys.exit(1)

    user_storage_config = user_config.storageConfig
    if parameters is None or parameters["storageConfigNames"] is None:
        # try to mount default storage
        requests.get("{}/api/v2/user/binyli".format(rest_server_uri), headers={'Authorization': user_token})
        sys.exit(0)

    storage_config_names = parameters["storageConfigNames"]
    if not is_valid_storage_config(user_storage_config, storage_config_names):
        logger.error("User %s do not has permission to access storages: %s", storage_config_names)
        sys.exit(1)

    storage_config_names = parameters["storageConfigNames"]
    storage_commands = generate_commands(storage_config_names)
    seperator = "\n\n"
    inject_commands(seperator.join(storage_commands), pre_script)

# // const validateStorageConfig = async (userName, config) => {
# //   const runtimePlugins = _.get(config, ['extras', 'com.microsoft.pai.runtimeplugin']);
# //   const teamwiseStoragePlugin = runtimePlugins.filter((plugin) => {
# //     plugin.plugin === 'teamwise-storage';
# //   });
# //   if (_.isEmpty(teamwiseStoragePlugin)) {
# //     return;
# //   }

# //   const storageConfigNames = _.get(teamwiseStoragePlugin, 'parameters.storageConfigNames');
# //   if (_.isEmpty(storageConfigNames)) {
# //     return;
# //   }
# //   for (const configName of storageConfigNames) {
# //     const isValid = await userModel.checkUserStorageConfig(userName, configName);
# //     if (isValid === false) {
# //       throw createError('Forbidden', 'ForbiddenUserError', `User ${userName} is not allowed access storage ${configName}`);
# //     }
# //   }
# // };
