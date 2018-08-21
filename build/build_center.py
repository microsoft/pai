from __future__ import print_function

from model import dependency_graph
from utility import docker_process
from utility import build_util

import os
import logging
import logging.config

class BuildCenter:

    def __init__(self, build_config, process_list):

        self.logger = logging.getLogger(__name__)
        setup_logger_config(self.logger)

        self.build_config = build_config

        self.process_list = [service.lower() for service in process_list] if not process_list == None else None

        # Initialize docker_cli instance
        self.docker_cli = docker_process.DockerClient(
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

        g = os.walk(self.codeDir)

        for path, dir_list, file_list in g:
            if path == self.codeDir:
                for service in dir_list:
                    self.graph.add_service(os.path.join(path, service), service)
            service_name = path.split(os.sep)
            service_name = service_name[-2] if len(service_name) > 1 else None
            for file_name in file_list:
                if file_name.endswith(".dockerfile"):
                    self.graph.add_docker_to_service(str(os.path.splitext(file_name)[0]), service_name)

    def resolve_dependency(self):

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
                                self.graph.add_dependency(self.graph.docker_to_service.get(image), service_name)
                elif file_name == "component.dep":
                    with open(os.path.join(path, file_name), "r") as fin:
                        for line in fin:
                            self.graph.add_dependency(line.strip(), service_name)
        # Show dependency graph
        self.graph.dump()

    def build_center(self):

        # Find services and map dockfile to services
        self.logger.info("Starts to construct service graph")
        self.construct_graph()
        self.logger.info("Construct service graph successfully")

        # Resolve dependency
        self.logger.info("Starts to resolve components dependency")
        self.resolve_dependency()
        self.logger.info("Resolves dependency successfully")

        # Build topology sequence
        services = self.graph.topology()
        self.logger.info("Build topological sequence:{0}".format(services))

        try:
            # Start build each component according to topological sequence
            build_worker = build_util.BuildUtil(self.docker_cli)
            self.process_list = self.graph.extract_sub_graph(self.process_list) if self.process_list else services
            print(self.process_list)
            for item in services:
                if item in self.process_list:
                    for inedge in self.graph.services[item].inedges:
                        build_worker.copy_dependency_folder(os.path.join(self.codeDir,inedge),os.path.join(self.graph.services[item].path,self.dependencyDir+inedge))
                    build_worker.build_single_component(self.graph.services[item])
            self.logger.info("Build each components succeed")
        except:
            self.logger.error("Pai build failed")
            raise
        finally:
            # Clean generated folder
            self.logger.info("Build to clean all temp folder")
            for item in services:
                build_worker.clean_temp_folder(self.graph.services[item].path)
            self.logger.info("Clean all temp folder succeed")


    def push_center(self):

        # Find services and map dockfile to services
        self.logger.info("Starts to construct service graph")
        self.construct_graph()
        self.logger.info("Construct service graph successfully")

        if not self.process_list == None:
            for image in self.process_list:
                if image not in self.graph.docker_to_service:
                    self.logger.error("{0} not in image list".format(image))
                    raise Exception("{0} not in image list".format(image))
                self.docker_cli.docker_image_tag(image,self.build_config['dockerRegistryInfo']['dockerTag'])
                self.docker_cli.docker_image_push(image,self.build_config['dockerRegistryInfo']['dockerTag'])
        else:
            # by default push all images
            for image in self.graph.docker_to_service:
                self.docker_cli.docker_image_tag(image,self.build_config['dockerRegistryInfo']['dockerTag'])
                self.docker_cli.docker_image_push(image,self.build_config['dockerRegistryInfo']['dockerTag'])


def setup_logger_config(logger):
    """
    Setup logging configuration.
    """
    logger.setLevel(logging.DEBUG)
    consoleHandler = logging.StreamHandler()
    consoleHandler.setLevel(logging.DEBUG)
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    consoleHandler.setFormatter(formatter)
    logger.addHandler(consoleHandler)


