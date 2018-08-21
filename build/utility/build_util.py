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
from . import docker_process

import sys
import logging
import logging.config
import os
import shutil


class BuildUtil:

    def __init__(self, docker_cli):

        self.logger = logging.getLogger(__name__)

        self.docker_cli = docker_cli

    def build_single_component(self, service):
        pre_build = os.path.join(service.path, 'build/build-pre.sh')
        if os.path.exists(pre_build):
            chmod_command = 'chmod u+x {0}'.format(pre_build)
            docker_process.execute_shell(chmod_command)
            print ("Pre", pre_build)
            docker_process.execute_shell(pre_build)

        for docker in service.docker_files:
            dockerfile = os.path.join(service.path, 'build/' + docker + '.dockerfile')
            self.docker_cli.docker_image_build(docker, dockerfile, service.path)

        post_build = os.path.join(service.path, 'build/build-post.sh')

        if os.path.exists(post_build):
            chmod_command = 'chmod u+x {0}'.format(post_build)
            docker_process.execute_shell(chmod_command)
            docker_process.execute_shell(post_build)
            print ("Post", post_build)

    def copy_dependency_folder(self, source, destination):
        if not os.path.exists(source):
            print("[DEBUG_LOG] {} folder path not exists".format(source))
            return None #TO-DO need raise error here
        else:
            if os.path.isdir(destination):
               shutil.rmtree(destination)
            shutil.copytree(source,destination)

    def clean_temp_folder(self, service_path):
        temp_generated_dir = os.path.join(service_path, "generated")
        temp_dependency_dir = os.path.join(service_path, "dependency")

        if os.path.isdir(temp_generated_dir):
            shutil.rmtree(temp_generated_dir)

        if os.path.isdir(temp_dependency_dir):
            shutil.rmtree(temp_dependency_dir)
