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



class image_push:


    def __init__(self, image_name, cluster_object_model, docker_cli):

        self.image_name = image_name
        self.tag = self.cluster_object_model['clusterinfo']['dockerregistryinfo']['docker_tag']
        self.docker_cli = docker_cli



    def image_tag(self):

        self.docker_cli.image_tag_to_registry(
            self.image_name,
            self.tag
        )



    def image_push(self):

        self.docker_cli.image_push_to_registry(
            self.image_name,
            self.tag
        )



    def run(self):

        self.image_tag()
        self.image_push()
