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


import docker
import file_handler
import linux_shell
import logging
import logging.config


# TODO: Change the command with linux_shell.execute_shell to docker lib.






class docker_handler:


    def __init__(self, docker_registry, docker_username, docker_password):

        self.logger = logging.getLogger(__name__)

        if docker_registry == "public":
            docker_registry = ""

        self.docker_registry = docker_registry
        self.docker_username = docker_username
        self.docker_password = docker_password

        self.docker_login()
        self.docker_client = self.client_initialization()



    def docker_login(self):

        shell_cmd = "docker login -u {0} -p {1} {2}".format(self.docker_username, self.docker_password, self.docker_registry)
        error_msg = "docker registry login error"
        linux_shell.execute_shell(shell_cmd, error_msg)
        self.logger.info("docker registry login successfully")



    def client_initialization(self):

        client = docker.from_env()
        return client



    def image_build(self, image_name, path_to_dockerfile, image_tag = "latest"):

        target_tag = "{0}:{1}".format(image_name, image_tag)
        image_obj, build_log = self.docker_client.images.build(path=path_to_dockerfile, tag=target_tag, rm=True, pull=True)
        for line in build_log:
            self.logger.info(line)



    def image_retag(self, origin_image_name, target_image_name, image_tag):

        origin_tag = "{0}:{1}".format(origin_image_name, image_tag)

        target_image = self.docker_client.images.get(origin_tag)
        target_image.tag(target_image_name, image_tag)



    def image_push(self, image_name, image_tag):

        target_tag = "{0}:{1}".format(image_name, image_tag)
        target_image = self.docker_client.images.push(image_name, image_tag)




