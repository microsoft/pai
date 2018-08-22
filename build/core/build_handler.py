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
from . import build_utility

import sys
import logging
import logging.config
import os
import shutil


class BuildHandler:

    def __init__(self, docker_cli):

        self.logger = logging.getLogger(__name__)
        build_utility.setup_logger_config(self.logger)

        self.docker_cli = docker_cli

        self.build_pre = 'build/build-pre.sh'
        self.build_post = 'build/build-post.sh'
        self.generatedDir = 'generated'
        self.dependencyDir = 'dependency'


    def build_single_component(self, service):

        self.logger.info("Starts to build {0}".format(service.service_name))

        pre_build = os.path.join(service.path, self.build_pre)
        if os.path.exists(pre_build):
            chmod_command = 'chmod u+x {0}'.format(pre_build)
            build_utility.execute_shell(chmod_command)
            build_utility.execute_shell(pre_build)

        for docker in service.docker_files:
            dockerfile = os.path.join(service.path, 'build/' + docker + '.dockerfile')
            self.docker_cli.docker_image_build(docker, dockerfile, service.path)

        post_build = os.path.join(service.path, self.build_post)
        if os.path.exists(post_build):
            chmod_command = 'chmod u+x {0}'.format(post_build)
            build_utility.execute_shell(chmod_command)
            build_utility.execute_shell(post_build)

        self.logger.info("Build {0} successfully".format(service.service_name))


    def copy_dependency_folder(self, source, destination):

        if not os.path.exists(source):
            self.logger.error("{0} folder path does not exist".format(source))
            sys.exit(1)
        else:
            if os.path.isdir(destination):
               shutil.rmtree(destination)
            shutil.copytree(source,destination)

    def clean_temp_folder(self, service_path):
        temp_generated_dir = os.path.join(service_path, self.generatedDir)
        temp_dependency_dir = os.path.join(service_path, self.dependencyDir)

        if os.path.isdir(temp_generated_dir):
            shutil.rmtree(temp_generated_dir)

        if os.path.isdir(temp_dependency_dir):
            shutil.rmtree(temp_dependency_dir)

