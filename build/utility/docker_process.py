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

from . import linux_shell
import logging
import logging.config

class DockerProcess:


    def __init__(self, docker_registry, docker_namespace, docker_username, docker_password):

        self.logger = logging.getLogger(__name__)
        
        docker_registry = "" if docker_registry == "public" else docker_registry
        print("[CAN-TEST-Docker-Process] docker_registry:", docker_registry)

        self.docker_registry = docker_registry
        self.docker_namespace = docker_namespace
        self.docker_username = docker_username
        self.docker_password = docker_password

        self.docker_login()


    def resolve_image_name(self, image_name):

        prefix = "" if self.docker_registry == "" else self.docker_registry + "/"
        return "{0}{1}/{2}".format(prefix, self.docker_namespace, image_name)



    def docker_login(self):

        shell_cmd = "docker login -u {0} -p {1} {2}".format(self.docker_username, self.docker_password, self.docker_registry)
        error_msg = "docker registry login error"
        linux_shell.execute_shell(shell_cmd, error_msg)
        self.logger.info("docker registry login successfully")


    def docker_image_build(self, image_name, dockerfile_path):

        cmd = "docker build -t {0} {1}".format(image_name, dockerfile_path)

        self.logger.info("Begin to execute the command: {0}".format(cmd))

        linux_shell.execute_shell(cmd)

        self.logger.info("Executing is successful.")

    
    def docker_image_tag(self, origin_image_name, image_tag):

        origin_tag = origin_image_name
        target_tag = "{0}:{1}".format(self.resolve_image_name(origin_image_name), image_tag)

        cmd = "docker tag {0} {1}".format(origin_tag, target_tag)

        self.logger.info("Begin to execute the command: {0}".format(cmd))

        linux_shell.execute_shell(cmd)

        self.logger.info("Executing is successful.")



    def docker_image_push(self, image_name, image_tag):

        target_tag = "{0}:{1}".format(self.resolve_image_name(image_name), image_tag)

        cmd = "docker push {0}".format(target_tag)
        
        self.logger.info("Begin to execute the command: {0}".format(cmd))

        linux_shell.execute_shell(cmd)

        self.logger.info("Executing is successful.")