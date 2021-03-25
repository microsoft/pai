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

import os
import logging

import temp_config
import temp_kubespray
from ..common import linux_shell


class RemoveNode:

    def __init__(self, kube_config_path=None, node_list=None, verbose=False):
        self._logger = logging.getLogger(__name__)
        self._kube_config_path = kube_config_path
        self._node_list = node_list
        if verbose:
            self._ansible_callback_vars = "export ANSIBLE_DISPLAY_OK_HOSTS=yes && export ANSIBLE_DISPLAY_SKIPPED_HOSTS=yes && export ANSIBLE_CALLBACK_WHITELIST=\"profile_tasks\" &&"
        else:
            self._ansible_callback_vars = "export ANSIBLE_DISPLAY_OK_HOSTS=no && export ANSIBLE_DISPLAY_SKIPPED_HOSTS=no && export ANSIBLE_CALLBACK_WHITELIST=\"\" &&"

    def run(self):
        temp_kubespray_folder = temp_kubespray.TempKubespray()
        temp_config_folder = temp_config.TempConfig(self._kube_config_path)
        node_list_string = ",".join(self._node_list)
        self._logger.info("Begin to remove nodes: {}".format(node_list_string))
        linux_shell.execute_shell_raise(
            shell_cmd="cd {} && {} ansible-playbook -i {} remove-node.yml -b --become-user=root -e \"@{}\" -e \"node={}\"".format(
                temp_kubespray_folder.get_folder_path(),
                self._ansible_callback_vars,
                temp_config_folder.get_hosts_yml_path(),
                temp_config_folder.get_openpai_yml_path(),
                node_list_string
            ),
            error_msg="Failed to add nodes: {}".format(node_list_string)
        )
