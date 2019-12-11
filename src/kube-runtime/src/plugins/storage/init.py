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
CLUSTER_ALIAS = 'cluster_alias'
USER_NAME = os.environ.get("PAI_USER_NAME")
PAI_REST_SERVER_URI = os.environ.get("PAI_REST_SERVER_URI")
USER_TOKEN = os.environ.get("PAI_USER_TOKEN").split()[-1]


if __name__ == "__main__":
    [parameters, pre_script, post_script] = plugin_init()

    if parameters is not None:
        sdk_version = parameters.get('sdkBranch', 'master')
        install_uri = '-e "git+https://github.com/Microsoft/pai@{}#egg=openpaisdk&subdirectory=contrib/python-sdk"'.format(sdk_version)
        container_sync_space = parameters.get('syncSpace', None)
        assert container_sync_space, 'Must specify a directory to save on persistent storage'
        #TODO: check DB for storage path
        storage_path_prefix = f"pai://{CLUSTER_ALIAS}/0"
        pre_commands = [
            # install openpaisdk
            f'python -m pip install {install_uri}',
            # add cluster
            f'pai add-cluster --cluster-alias {CLUSTER_ALIAS} --pai-uri {PAI_REST_SERVER_URI} --user {USER_NAME} --token {USER_TOKEN}',
            # download 
            f'pai copy {storage_path_prefix}/$PAI_USER_NAME/$PAI_JOB_NAME/$PAI_CURRENT_TASK_ROLE_NAME/$PAI_CURRENT_TASK_ROLE_CURRENT_TASK_INDEX {container_sync_space}'
        ]
        post_commands = [
            # delete file 
            f'pai delete {storage_path_prefix}/$PAI_USER_NAME/$PAI_JOB_NAME/$PAI_CURRENT_TASK_ROLE_NAME/$PAI_CURRENT_TASK_ROLE_CURRENT_TASK_INDEX',
            # upload file
            f'pai copy {container_sync_space} {storage_path_prefix}/$PAI_USER_NAME/$PAI_JOB_NAME/$PAI_CURRENT_TASK_ROLE_NAME/$PAI_CURRENT_TASK_ROLE_CURRENT_TASK_INDEX']
        inject_commands(pre_commands, pre_script)
        inject_commands(post_commands, post_script)

