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
import logging.config

from ..common import linux_shell
from ..common import file_handler
from ..common import directory_handler
from ..common import docker_handler
from ..common import template_handler



class image_build:


    def __init__(self, image_name, image_conf, cluster_object_model, docker_cli):

        self.logger = logging.getLogger(__name__)

        self.image_name = image_name
        self.image_conf = image_conf
        self.cluster_object_model = cluster_object_model
        self.docker_cli = docker_cli

        self.copy_list = None

        # empty configuration. Such as cleaning image
        if image_conf == None:
            return

        if "copy-list" in image_conf:
            self.copy_list = image_conf["copy-list"]


    def prepare_copyfile(self):

        self.logger.info("Begin to prepare the copy file for {0}'s image.".format(self.image_name))

        if self.copy_list == None:
            self.logger.info("There is no copy file for {0}'s image.".format(self.image_name))
            return

        for copy_file in self.copy_list:
            file_src_path = copy_file["src"]
            file_dst_path = copy_file["dst"]
            directory_handler.directory_copy(file_src_path, file_dst_path)

        self.logger.info("Copy file for {0}'s image is prepared.".format(self.image_name))


    def cleanup_copied_file(self):

        self.logger.info("Begin to delete the copied file of {0}'s image.".format(self.image_name))

        if self.copy_list == None:
            self.logger.info("There is no copied file of {0}'s image to be deleted.".format(self.image_name))
            return

        for copy_file in self.copy_list:
            target_path =  copy_file["dst"]
            if directory_handler.directory_exist_or_not(target_path):
                directory_handler.directory_delete(target_path)

        self.logger.info("The copied files of {0}'s image have been cleaned up.".format(self.image_name))



    def build(self):

        self.logger.info("Begin to build {0}'s image".format(self.image_name))
        self.docker_cli.image_build(
            self.image_name,
            "./src/{0}/".format(self.image_name)
        )
        self.logger.info("The building of {0}'s image is successful.".format(self.image_name))



    def run(self):
        self.prepare_copyfile()
        self.build()
        self.cleanup_copied_file()






