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
import logging.config
#
from . import image_push
from . import image_build
from . import image_tag
from . import hadoop_ai_build
#
from ..common import linux_shell
from ..common import file_handler
from ..common import directory_handler
from ..common import docker_handler


class build_center:



    def __init__(self, cluster_object_model, build_target = None, os_type="ubuntu16.04"):

        self.logger = logging.getLogger(__name__)

        self.cluster_object_model = cluster_object_model
        if build_target == None:
            self.image_list = self.get_image_list()
        else:
            self.image_list = build_target

        self.os_type = os_type



    def get_image_list(self):

        image_list = list()

        subdir_list = directory_handler.get_subdirectory_list("src/")
        for subdir in subdir_list:

            image_conf_path =  "src/{0}/image.yaml".format(subdir)
            if file_handler.file_exist_or_not(image_conf_path):
                image_list.append(subdir)

        self.logger.info("Get the image-list to build : {0}".format(str(image_list)))

        return image_list

    def get_base_image(self, image_name):
        file_path = "src/{0}/dockerfile".format(image_name)
        with open(file_path, 'r') as fin:
            for line in fin:
                if line.strip().startswith("FROM"):
                    _, image = line.split()
                    if image.split(':')[0] in self.get_image_list():
                       return image
                    break
        return None


    def hadoop_binary_prepare(self):

        custom_hadoop_path = self.cluster_object_model['clusterinfo']['hadoopinfo']['custom_hadoop_binary_path']
        hadoop_version = self.cluster_object_model['clusterinfo']['hadoopinfo']['hadoopversion']

        self.logger.info("Begin to prepare the hadoop binary for image building.")

        if os.path.exists("src/hadoop-run/hadoop") != True:
            directory_handler.directory_create("src/hadoop-run/hadoop")

        if custom_hadoop_path != "None":
            self.logger.info("Customized hadoop path is found.")
            directory_handler.directory_copy(custom_hadoop_path, "src/hadoop-run/hadoop")
        else:
            self.logger.info("None customized hadoop path is found. An official hadoop will be downloaded.")
            url = "http://archive.apache.org/dist/hadoop/common/{0}/{0}.tar.gz".format("hadoop-" + hadoop_version)
            shell_cmd = "wget {0} -P src/hadoop-run/hadoop".format(url)
            error_msg = "failed to wget hadoop binary"
            linux_shell.execute_shell(shell_cmd, error_msg)

        self.logger.info("Hadoop binary is prepared.")



    def hadoop_binary_remove(self):

        self.logger.info("Remove the hadoop binary.")

        binary_path = "src/hadoop-run/hadoop"
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

        base_image = self.get_base_image(image_name)
        if base_image != None:
            self.build(base_image)

        self.logger.info("-----------------------------------------------------------")
        self.logger.info("Begin to build {0}'s image.".format(image_name))
        image_build_worker.run()
        self.done_dict[image_name] = True
        self.logger.info("{0}'s image building is successful.".format(image_name))
        self.logger.info("-----------------------------------------------------------")
        self.tag(image_name)



    def tag(self, image_name):

        image_tag_worker = image_tag.image_tag(
            image_name,
            self.cluster_object_model,
            self.docker_cli)
        image_tag_worker.run()



    def hadoop_ai_build(self):

        hadoop_version = self.cluster_object_model['clusterinfo']['hadoopinfo']['hadoopversion']
        hadoop_ai_path = self.cluster_object_model['clusterinfo']['hadoopinfo']['custom_hadoop_binary_path']
        hadoop_ai_build_instance = hadoop_ai_build.hadoop_ai_build(self.os_type, hadoop_version, hadoop_ai_path)
        hadoop_ai_build_instance.build()



    def run(self):

        self.hadoop_binary_remove()
        self.hadoop_ai_build()
        self.hadoop_binary_prepare()

        self.done_dict = dict()
        self.docker_cli = docker_handler.docker_handler(
            docker_registry = self.cluster_object_model['clusterinfo']['dockerregistryinfo']['docker_registry_domain'],
            docker_namespace = self.cluster_object_model['clusterinfo']['dockerregistryinfo']['docker_namespace'],
            docker_username = self.cluster_object_model['clusterinfo']['dockerregistryinfo']['docker_username'],
            docker_password = self.cluster_object_model['clusterinfo']['dockerregistryinfo']['docker_password']
        )

        for image_name in self.image_list:
            if file_handler.file_exist_or_not("src/{0}/image.yaml".format(image_name)) == False:
                self.logger.warning("image.yaml can't be found on the directory of {0}".format(image_name))
                self.logger.warning("Please check your source code. The {0}'s image will be skipped")
                continue
            if image_name in self.done_dict and self.done_dict[image_name] == True:
                continue
            self.build(image_name)

        self.hadoop_binary_remove()













