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

from model import dependency_graph
from . import build_utility
from . import build_handler

import os
import sys
import logging
import logging.config

class BuildCenter:

    def __init__(self, build_config, process_list):

        self.logger = logging.getLogger(__name__)
        build_utility.setup_logger_config(self.logger)

        self.build_config = build_config

        self.process_list = [service.lower() for service in process_list] if not process_list == None else None

        # Initialize docker_cli instance
        self.docker_cli = build_utility.DockerClient(
            docker_registry = self.build_config['dockerRegistryInfo']['dockerRegistryDomain'],
            docker_namespace = self.build_config['dockerRegistryInfo']['dockerNameSpace'],
            docker_username = self.build_config['dockerRegistryInfo']['dockerUserName'],
            docker_password = self.build_config['dockerRegistryInfo']['dockerPassword']
        )

        # Initialize graph instance
        self.graph = dependency_graph.ServiceGraph()

        # Initialize dirs
        self.codeDir = "src"
        self.dependencyDir = "dependency/"


    def construct_graph(self):
        self.logger.info("Starts to construct service graph")

        g = os.walk(self.codeDir)
        for path, dir_list, file_list in g:
            if path == self.codeDir:
                for service in dir_list:
                    self.graph.add_service(os.path.join(path, service), service)
            service_name = path.split(os.sep)
            service_name = service_name[-2] if len(service_name) > 1 else None
            for file_name in file_list:
                if file_name.endswith(".dockerfile"):
                    self.graph.add_image_to_service(str(os.path.splitext(file_name)[0]), service_name)
        self.logger.info("Construct service graph successfully")

    def resolve_dependency(self):
        self.logger.info("Starts to resolve components dependency")

        g = os.walk(self.codeDir)
        for path, dir_list, file_list in g:
            service_name = path.split(os.sep)
            service_name = service_name[-2] if len(service_name) > 1 else None
            for file_name in file_list:
                if file_name.endswith(".dockerfile"):
                    with open(os.path.join(path, file_name), 'r') as fin:
                        for line in fin:
                            if line.strip().startswith("FROM"):
                                image = line.split()[1]
                                self.graph.add_dependency(self.graph.image_to_service.get(image), service_name)
                elif file_name == "component.dep":
                    with open(os.path.join(path, file_name), "r") as fin:
                        for line in fin:
                            self.graph.add_dependency(line.strip(), service_name)
        # Show dependency graph
        # self.graph.dump()

        self.logger.info("Resolves dependency successfully")

    def build_center(self):

        # Find services and map dockfile to services
        self.construct_graph()

        # Check all process_list items are valid or not
        if not self.process_list == None:
            for item in self.process_list:
                if item not in self.graph.services:
                    self.logger.error("service {0} is invalid".format(item))
                    sys.exit(1)

        # Resolve dependency
        self.resolve_dependency()

        # Build topology sequence
        services = self.graph.topology()
        self.logger.info("topological sequence:{0}".format(services))

        # Start build each component according to topological sequence
        try:
            build_worker = build_handler.BuildHandler(self.docker_cli)
            self.process_list = self.graph.extract_sub_graph(self.process_list) if self.process_list else services
            for item in services:
                if item in self.process_list:
                    for inedge in self.graph.services[item].inedges:
                        build_worker.copy_dependency_folder(os.path.join(self.codeDir,inedge),
                        os.path.join(self.graph.services[item].path,self.dependencyDir+inedge))
                    build_worker.build_single_component(self.graph.services[item])
            self.logger.info("Build all components succeed")

        except:
            self.logger.error("Build all components failed")
            sys.exit(1)

        finally:
            # Clean generated folder
            self.logger.info("Begin to clean all temp folder")
            for item in services:
                build_worker.clean_temp_folder(self.graph.services[item].path)
            self.logger.info("Clean all temp folder succeed")


    def push_center(self):

        # Find services and map dockfile to services
        self.construct_graph()

        if not self.process_list == None:
            for image in self.process_list:
                if image not in self.graph.image_to_service:
                    self.logger.error("{0} not in image list".format(image))
                    sys.exit(1)

                self.logger.info("Starts to push image: {0}".format(image))
                self.docker_cli.docker_image_tag(image,self.build_config['dockerRegistryInfo']['dockerTag'])
                self.docker_cli.docker_image_push(image,self.build_config['dockerRegistryInfo']['dockerTag'])
                self.logger.info("Push image:{0} successfully".format(image))
        else:
            # by default push all images
            for image in self.graph.image_to_service:
                self.logger.info("Starts to push image: {0}".format(image))
                self.docker_cli.docker_image_tag(image,self.build_config['dockerRegistryInfo']['dockerTag'])
                self.docker_cli.docker_image_push(image,self.build_config['dockerRegistryInfo']['dockerTag'])
                self.logger.info("Push image:{0} successfully".format(image))




