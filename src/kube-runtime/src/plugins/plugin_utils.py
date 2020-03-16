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

import logging
import argparse
import os
import shutil
import yaml

from common.utils import init_logger

LOGGER = logging.getLogger(__name__)


class PluginHelper:  #pylint: disable=too-few-public-methods
    def __init__(self, plugin_config: dict):
        self._parameters = plugin_config.get("parameters", "")
        self._plugin_name = plugin_config.get("plugin", "")
        self._failure_policy = plugin_config.get("failurePolicy", "fail")

    def inject_commands(self, commands, script):
        new_commands = []
        if commands:
            new_commands = [x + "\n" for x in commands]
            if self._failure_policy.lower() == "ignore":
                new_commands.insert(0, "set +o errexit\n")
                new_commands.append("set -o errexit\n")
            with open(script, 'a+') as f:
                f.writelines(new_commands)


def plugin_init():
    init_logger()
    parser = argparse.ArgumentParser()
    parser.add_argument("plugin_config",
                        help="plugin config for runtime plugin in yaml")
    parser.add_argument("pre_script", help="script for pre commands")
    parser.add_argument("post_script", help="script for post commands")
    args = parser.parse_args()

    plugin_config = yaml.safe_load(args.plugin_config)

    return [plugin_config, args.pre_script, args.post_script]


PAI_WORK_DIR = "/usr/local/pai"


def try_to_install_by_cache(group_name: str, fallback_cmds: list):
    source_folder = "/opt/package_cache"
    target_folder = os.path.join(PAI_WORK_DIR, "package_cache")
    if not os.path.exists(source_folder):
        return "{};".format(";".join(fallback_cmds))
    exists_group_names = os.listdir(source_folder)
    needed_group_names = [name for name in exists_group_names if name.startswith(group_name + '-')]
    for name in needed_group_names:
        name_source_folder = os.path.join(source_folder, name)
        name_target_folder = os.path.join(target_folder, name)
        if not os.path.exists(name_target_folder):  # avoid duplicate copy
            shutil.copytree(name_source_folder, name_target_folder)
    cached_cmd = "/bin/bash {}/runtime.d/install_group.sh ".format(PAI_WORK_DIR) + group_name
    return "{} || {{ {}; }}".format(cached_cmd, ";".join(fallback_cmds))
