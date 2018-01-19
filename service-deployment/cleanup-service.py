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

import subprocess
import sys
import time
from kubernetesTool import servicestatus
import yaml


def load_yaml_config(config_path):

    with open(config_path, "r") as f:
        cluster_data = yaml.load(f)

    return cluster_data



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



def main():

    service_config = load_yaml_config("service.yaml")

    for serv in service_config['servicelist']:

        if 'stopscript' not in service_config['servicelist'][serv]:
            continue

        # Cleanup cluster-configuration will lose secret of private registry.
        # Then the cleaning-image will be failed to pull.
        if serv == 'cluster-configuration':
            continue

        shell_cmd = 'chmod a+x ./bootstrap/{0}/{1}'.format(serv, service_config['servicelist'][serv]['stopscript'])
        error_msg = 'Failed make the {0} stop script executable'.format(serv)
        execute_shell(shell_cmd, error_msg)

        shell_cmd = './bootstrap/{0}/{1}'.format(serv, service_config['servicelist'][serv]['stopscript'])
        error_msg = 'Failed stop the service {0}'.format(serv)
        execute_shell(shell_cmd, error_msg)

    shell_cmd = "kubectl create -f ./bootstrap/cleaning/cleaning.yaml"
    error_msg = "failed to start clean up job to every node"
    execute_shell(shell_cmd, error_msg)

    timeout = 1800

    while servicestatus.is_service_ready('cleaning-one-shot') != True:

        print "The cleaning job not finish yet. Pleas wait for a moment!"
        time.sleep(5)

        timeout = timeout - 5
        if timeout < 0:
            print "Failed cleaning your cluster. please check the cleaning job and delete it manually."
            print "To delete the image, please run -- kubectl delete ds cleaning-one-shot"
            sys.exit(1)


    shell_cmd = "kubectl delete ds cleaning-one-shot"
    error_msg = "Successfully to delete cleaning-one-shot"
    execute_shell(shell_cmd, error_msg)

    serv = 'cluster-configuration'
    shell_cmd = 'chmod a+x ./bootstrap/{0}/{1}'.format(serv, service_config['servicelist'][serv]['stopscript'])
    error_msg = 'Failed make the {0} stop script executable'.format(serv)
    execute_shell(shell_cmd, error_msg)

    shell_cmd = './bootstrap/{0}/{1}'.format(serv, service_config['servicelist'][serv]['stopscript'])
    error_msg = 'Failed stop the service {0}'.format(serv)
    execute_shell(shell_cmd, error_msg)

    print "The cleaning job finished!"



if __name__ == "__main__":
    main()