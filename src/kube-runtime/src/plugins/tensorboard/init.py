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
import os
import sys

from jinja2 import Template

sys.path.append(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "../.."))
from plugins.plugin_utils import plugin_init, PluginHelper  #pylint: disable=wrong-import-position

LOGGER = logging.getLogger(__name__)
TASK_ROLE_NAME = os.getenv("PAI_CURRENT_TASK_ROLE_NAME")
TASK_ROLE_LIST = os.getenv("PAI_TASK_ROLE_LIST").split(",")
TASK_ROLE_INDEX = int(os.getenv("PAI_TASK_INDEX"))


def generate_tensorboard_commands(template_file, parameters):
    logdir = ",".join(
        ["{}:{}".format(k, v) for k, v in parameters["logdir"].items()])
    with open(template_file) as f:
        template = Template(f.read())
    return template.render(logdir=logdir, port=parameters["port"])


def main():
    LOGGER.info("Preparing tensorboard runtime plugin commands")

    [plugin_config, pre_script, _] = plugin_init()
    parameters = plugin_config.get("parameters")

    if TASK_ROLE_LIST[0] != TASK_ROLE_NAME or TASK_ROLE_INDEX != 0:
        LOGGER.info(
            "Not first taskrole or not first task instance, ignore this plugin"
        )
        return
    if not parameters:
        LOGGER.info("Tensorboard plugin parameters is empty, ignore this")
        return

    current_dir = os.path.dirname(os.path.abspath(__file__))
    template_file = "{}/tensorboard.sh.template".format(current_dir)
    with open("{}/tensorboard.sh".format(current_dir), "w+") as f:
        f.write(generate_tensorboard_commands(template_file, parameters))

    tensorboard_exec_path = "{}/tensorboard.sh".format(current_dir)
    commands = [
        "chmod u+x {}".format(tensorboard_exec_path), tensorboard_exec_path
    ]

    PluginHelper(plugin_config).inject_commands(commands, pre_script)
    LOGGER.info("Tensorboard runtime plugin perpared")


if __name__ == "__main__":
    main()
