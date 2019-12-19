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

sys.path.append(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "../.."))
from plugins.plugin_utils import plugin_init, PluginHelper  #pylint: disable=wrong-import-position

LOGGER = logging.getLogger(__name__)


def main():
    LOGGER.info("Preparing ssh runtime plugin commands")
    [plugin_config, pre_script, _] = plugin_init()
    plugin_helper = PluginHelper(plugin_config)
    parameters = plugin_config.get("parameters")

    if not parameters:
        LOGGER.info("Ssh plugin parameters is empty, ignore this")
        return

    if "jobssh" in parameters:
        jobssh = str(parameters["jobssh"]).lower()
    else:
        jobssh = "false"
    cmd_params = [jobssh]

    if "userssh" in parameters:
        if "type" in parameters["userssh"] and "value" in parameters["userssh"]:
            cmd_params.append(str(parameters["userssh"]["type"]))
            cmd_params.append("\'{}\'".format(parameters["userssh"]["value"]))

    # write call to real executable script
    command = [
        "{}/sshd.sh {}\n".format(os.path.dirname(os.path.abspath(__file__)),
                                 " ".join(cmd_params))
    ]

    # ssh barrier
    if jobssh == "true" and "sshbarrier" in parameters and str(
            parameters["sshbarrier"]).lower() == "true":
        if "sshbarriertaskroles" in parameters:
            barrier_params = " ".join(
                '"{}"'.format(tr) for tr in parameters["sshbarriertaskroles"])
        else:
            barrier_params = ""
        command.append("{}/sshbarrier.sh {}\n".format(
            os.path.dirname(os.path.abspath(__file__)), barrier_params))

    plugin_helper.inject_commands(command, pre_script)
    LOGGER.info("Ssh runtime plugin perpared")


if __name__ == "__main__":
    main()
