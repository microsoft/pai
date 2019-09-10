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

from __future__ import print_function

import os
import sys
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import collections
import logging
import argparse
import yaml

from plugin_utils import plugin_init, inject_commands

logger = logging.getLogger(__name__)

if __name__ == "__main__":
    [parameters, pre_script, post_script] = plugin_init()

    if parameters is not None:
        if "jobssh" in parameters:
            jobssh = str(parameters["jobssh"]).lower()
        else:
            jobssh = "false"
        cmdParams = [jobssh]

        if "userssh" in parameters:
            if "type" in parameters["userssh"] and "value" in parameters["userssh"]:
                cmdParams.append(str(parameters["userssh"]["type"]))
                cmdParams.append("\'{}\'".format(parameters["userssh"]["value"]))

        # write call to real executable script
        command = ["{}/sshd.sh {}\n".format(os.path.dirname(os.path.abspath(__file__)), " ".join(cmdParams))]

        # ssh barrier
        if jobssh == "true" and "sshbarrier" in parameters and str(parameters["sshbarrier"]).lower() == "true":
            if "sshbarriertaskroles" in parameters:
                barrierParams = " ".join('"{}"'.format(tr) for tr in parameters["sshbarriertaskroles"])
            else:
                barrierParams = ""
            command.append("{}/sshbarrier.sh {}\n".format(os.path.dirname(os.path.abspath(__file__)), barrierParams))

        inject_commands(command, pre_script)
