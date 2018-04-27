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

from ..common import linux_shell
from ..common import file_handler
from ..common import directory_handler
from ..common import docker_handler
from ..common import template_handler


class build_center:



    def __init__(self, cluster_object_model, build_target = None):

        self.cluster_object_model = cluster_object_model
        if build_target != None:
            self.image_list = self.get_image_list()
        else:
            self.image_list = build_target



    def get_image_list(self):

        image_list = list()

        subdir_list = directory_handler.get_subdirectory_list("src/")
        for subdir in subdir_list:

            image_conf_path =  "src/{0}/image.yaml".format(subdir)
            if file_handler.file_exist_or_not(image_conf_path):
                image_list.append(subdir)

        return image_list



    def hadoop_binary_prepare(custom_hadoop_path, hadoop_version):

        if os.path.exists("src/hadoop-run/hadoop") != True:
            directory_handler.directory_create("src/hadoop-run/hadoop")

        if custom_hadoop_path != "None":
            directory_handler.directory_copy(custom_hadoop_path, "src/hadoop-run/hadoop")
        else:
            url = "http://archive.apache.org/dist/hadoop/common/{0}/{0}.tar.gz".format("hadoop-" + hadoop_version)
            shell_cmd = "wget {0} -P src/hadoop-run/hadoop".format(url)
            error_msg = "failed to wget hadoop binary"
            linux_shell.execute_shell(shell_cmd, error_msg)



    def hadoop_binary_remove(hadoop_version):
        binary_path = "src/hadoop-run/hadoop".format(hadoop_version)
        if os.path.exists(binary_path):
            directory_handler.directory_delete(binary_path)



    def build(self, image_name):

        if image_name in self.done_dict and self.done_dict[image_name] == True:
            return

        image_conf = file_handler.load_yaml_config("src/{0}/image.yaml".format(image_name))

        image_build_worker = image_build.image_build(
            image_name,
            image_conf,
            self.cluster_object_model,
            self.docker_cli
        )

        base_image = image_build_worker.get_dependency()
        if base_image != None:
            self.build(base_image)

        image_build_worker.run()



    def run(self):

        self.hadoop_binary_remove()
        self.hadoop_binary_prepare()

        self.done_dict = dict()
        self.docker_cli = docker_handler.docker_handler(
            docker_registry = self.cluster_object_model['clusterinfo']['dockerregistryinfo']['docker_registry_domain'],
            docker_namespace = self.cluster_object_model['clusterinfo']['dockerregistryinfo']['docker_namespace'],
            docker_username = self.cluster_object_model['clusterinfo']['dockerregistryinfo']['docker_username'],
            docker_password = self.cluster_object_model['clusterinfo']['dockerregistryinfo']['docker_password']
        )

        for image_name in self.image_list:
            if file_handler.file_exist_or_not("src/{0}/image.yaml".format()) == False:
                continue
            if image_name in self.done_dict and self.done_dict[image_name] == True:
                continue
            self.build(image_name)

        for image_name in self.image_list:
            if file_handler.file_exist_or_not("src/{0}/image.yaml".format()) == False:
                continue
            image_push_worker = image_push.image_push(image_name, self.cluster_object_model, self.docker_cli)
            image_push_worker.run()


        self.hadoop_binary_remove()













