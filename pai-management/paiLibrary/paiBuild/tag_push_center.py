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

import image_push
import image_build
import logging
import logging.config

from ..common import linux_shell
from ..common import file_handler
from ..common import directory_handler
from ..common import docker_handler


class tag_push_center:

    def __init__(self, cluster_object_model, tag_push_target = None, os_type="ubuntu16.04"):

        self.logger = logging.getLogger(__name__)

        self.cluster_object_model = cluster_object_model
        if tag_push_target == None:
            self.image_list = self.get_image_list()
        else:
            self.image_list = tag_push_target

        self.os_type = os_type


    def get_image_list(self):

        image_list = list()

        subdir_list = directory_handler.get_subdirectory_list("src/")
        for subdir in subdir_list:

            image_conf_path =  "src/{0}/image.yaml".format(subdir)
            if file_handler.file_exist_or_not(image_conf_path):
                image_list.append(subdir)

        self.logger.info("Get the image-list to tag and push : {0}".format(str(image_list)))

        return image_list



    def run(self):

        self.docker_cli = docker_handler.docker_handler(
            docker_registry=self.cluster_object_model['clusterinfo']['dockerregistryinfo']['docker_registry_domain'],
            docker_namespace=self.cluster_object_model['clusterinfo']['dockerregistryinfo']['docker_namespace'],
            docker_username=self.cluster_object_model['clusterinfo']['dockerregistryinfo']['docker_username'],
            docker_password=self.cluster_object_model['clusterinfo']['dockerregistryinfo']['docker_password']
        )

        for image_name in self.image_list:
            if file_handler.file_exist_or_not("src/{0}/image.yaml".format()) == False:
                self.logger.warning("image.yaml can't be found on the directory of {0}".format(image_name))
                self.logger.warning("Please check your source code. The {0}'s image will be skipped")
                continue
            image_push_worker = image_push.image_push(image_name, self.cluster_object_model, self.docker_cli)
            image_push_worker.run()

