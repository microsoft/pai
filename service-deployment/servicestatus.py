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

import yaml
import os
import sys
import subprocess


def execute_shell_with_output(shell_cmd, error_msg):

    try:
        res = subprocess.check_output( shell_cmd, shell=True )

    except subprocess.CalledProcessError:
        print error_msg
        sys.exit(1)

    return res



def execute_shell(shell_cmd, error_msg):

    try:
        subprocess.check_call( shell_cmd, shell=True )

    except subprocess.CalledProcessError:
        print error_msg
        sys.exit(1)


# To check a service ready or not. Note that service name should be same as the name in the metadata in the yaml file.
def is_service_ready(servicename):

    output = execute_shell_with_output( "kubectl get pod | grep {0} | cut -d' ' -f1".format(servicename),
                                          "Failed to get the pod list of {0}".format(servicename))

    pod_list = output.splitlines()

    if len(pod_list) == 0:
        return False

    for pod in pod_list:

        status = execute_shell_with_output( "kubectl describe pod {0} | grep 'Ready: ' ".format(pod),
                                            "Failed to status of {0}".format(pod))
        if status.find("True") == -1:
            return False

    return True

