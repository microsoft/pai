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


import yaml
import argparse
import logging
import collections
import os
import sys
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from plugin_utils import plugin_init, inject_commands


logger = logging.getLogger(__name__)
CLUSTER_ALIAS = 'cluster_alias'
USER_NAME = os.environ.get("PAI_USER_NAME")
JOB_NAME = os.environ.get("PAI_JOB_NAME")
TASK_ROLE = os.environ.get("PAI_CURRENT_TASK_ROLE_NAME")
TASK_INDEX = os.environ.get("PAI_CURRENT_TASK_ROLE_CURRENT_TASK_INDEX")

# $PAI_REST_SERVER_URI = "http://XX.XX.XX.XX:XXXX"
PAI_REST_SERVER_URI = os.environ.get("PAI_REST_SERVER_URI")
# $PAI_USER_TOKEN = "Bearer <token>"
USER_TOKEN = os.environ.get("PAI_USER_TOKEN").split()[-1]


if __name__ == "__main__":
    [parameters, pre_script, post_script] = plugin_init()

    if parameters is not None:
        sdk_version = parameters.get('sdkBranch', 'pai-for-edu')
        install_uri = '-e "git+https://github.com/Microsoft/pai@{}#egg=openpaisdk&subdirectory=contrib/python-sdk"'.format(sdk_version)
        container_sync_space = parameters.get('syncSpace', '/persistent')
        remote_storage_space = parameters.get('storagePath', None)
        if not remote_storage_space:
            # TODO: check DB for storage path
            remote_storage_space = 'system~0'
        storage_path_prefix = f"pai://{CLUSTER_ALIAS}/{remote_storage_space}"

        # remote inputs / outputs for current
        remote_job_inputs_path = f'{storage_path_prefix}/{USER_NAME}/{JOB_NAME}/inputs'  # assume one job has only one input folder
        remote_task_outputs_path = f'{storage_path_prefix}/{USER_NAME}/{JOB_NAME}/{TASK_ROLE}/{TASK_INDEX}'  # every task has a seperate output folder

        pre_commands = [
            # install openpaisdk
            f'python -m pip install {install_uri}',
            # add cluster
            f'pai add-cluster --cluster-alias {CLUSTER_ALIAS} --pai-uri {PAI_REST_SERVER_URI} --user {USER_NAME} --token {USER_TOKEN}',
            # create sync cache
            f'pai delete {container_sync_space}',
            f'pai makedir {container_sync_space}',
            f'pai makedir {container_sync_space}/outputs',
            f'pai makedir {container_sync_space}/inputs',

            # download
            f'pai copy {remote_job_inputs_path} {container_sync_space}/inputs'
        ]
        post_commands = [
            # delete file
            f'pai delete {remote_task_outputs_path}',
            # upload file
            f'pai copy {container_sync_space}/outputs {remote_task_outputs_path}'
        ]
        inject_commands(pre_commands, pre_script)
        inject_commands(post_commands, post_script)
