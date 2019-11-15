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

logging.basicConfig(
    format="%(asctime)s - %(levelname)s - %(filename)s:%(lineno)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

# REST_API_PREFIX = os.environ.get("PAI_REST_SERVER_URI")
# USER_TOKEN = os.environ.get("PAI_USER_TOKEN")
# USER_NAME = os.environ.get("PAI_USER")
STORAGE_PRE_COMMAND = ["apt-get update", "umask 000"]
REST_API_PREFIX = "http://10.151.40.4:9186"
USER_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImJpbnlsaSIsImFwcGxpY2F0aW9uIjpmYWxzZSwiaWF0IjoxNTczNjMzMTQ0LCJleHAiOjE1NzQyMzc5NDR9.gMQ0zgqh_0BrLm3Tcviwgubq9jMG0TKLTz8ZRZJ-UsA"
USER_NAME = "binyli"


def http_get(url):
    logger.info("Send get request with url %s", url)
    return requests.get(url, headers={'Authorization': USER_TOKEN})


def is_valid_storage_config(user_storage_config, storage_config_names):
    for storage_config in storage_config_names:
        if storage_config not in user_storage_config:
            return False
    return True


def generate_commands(storage_config_names):
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
    servers_config = resp.json()

    return list(map(lambda config: generage_storage_command(config, servers_config), storage_configs))


def generage_storage_command(storage_config, servers_config):
    mount_commands = ""
    for mount in storage_config["mountInfos"]:
        server_config = next(
            conf for conf in servers_config if conf.spn == mount.spn)
        if server_config.type == "nfs":
            pass
    return mount_commands


if __name__ == "__main__":
    logger.info("Preparing storage runtime plugin commands")
    # [parameters, pre_script, post_script] = plugin_init()
    parameters = {"storageConfigNames": ["STORAGE_BJ"]}

    commands = []

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
    inject_commands(seperator.join(storage_commands), pre_script)

    logger.info("Storage runtime plugin perpared")
