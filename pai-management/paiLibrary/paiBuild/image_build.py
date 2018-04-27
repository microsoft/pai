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



from ..common import linux_shell
from ..common import file_handler
from ..common import directory_handler
from ..common import docker_handler
from ..common import template_handler



class image_build:


    def __init__(self, image_name, image_conf, cluster_object_model, docker_cli):

        self.image_name = image_name
        self.image_conf = image_conf
        self.cluster_object_model = cluster_object_model
        self.docker_cli = docker_cli

        self.base_image = None
        self.copy_list = None
        self.template_list = None

        if "prerequisite" in image_conf:
            self.base_image = image_conf["prerequisite"]
        if "template-list" in image_conf:
            self.template_list = image_conf["template-list"]
        if "copy-list" in image_conf:
            self.copy_list = image_conf["copy-list"]



    def get_dependency(self):

        return self.base_image



    def prepare_template(self):

        if self.template_list == None:
            return

        for template_file in self.template_list:
            file_path = "src/{0}/{1}.template".format(self.image_name, template_file)
            template_data = file_handler.read_template(file_path)
            map_dict = {
                "clusterconfig" : self.cluster_object_model
            }
            generated_data = template_handler.generate_from_template_dict(template_data, map_dict)
            file_handler.write_generated_file("src/{0}/{1}".format(self.image_name, template_file), generated_data)



    def prepare_copyfile(self):

        if self.copy_list == None:
            return

        for copy_file in self.copy_list:
            file_src_path = copy_file["src"]
            file_dst_path = copy_file["dst"]
            directory_handler.directory_copy(file_src_path, file_dst_path)



    def cleanup_generated_template(self):

        if self.template_list == None:
            return

        for template_file in self.template_list:
            file_path = "src/{0}/{1}".format(self.image_name, template_file)
            if file_handler.file_exist_or_not(file_path) == True:
                file_handler.file_delete(file_path)



    def cleanup_copied_file(self):

        if self.copy_list == None:
            return

        for copy_file in self.copy_list:
            target_path =  copy_file["dst"]
            if directory_handler.directory_exist_or_not(target_path):
                directory_handler.directory_delete(target_path)



    def build(self):

        self.docker_cli.image_build(
            self.image_name,
            "./src/{0}/".format(self.image_name),
            image_tag = self.cluster_object_model['clusterinfo']['dockerregistryinfo']['docker_tag']
        )



    def run(self):

        self.prepare_copyfile()
        self.prepare_template()
        self.build()
        self.cleanup_copied_file()
        self.cleanup_generated_template()






