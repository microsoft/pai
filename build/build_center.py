from __future__ import absolute_import
from __future__ import print_function

from utility import linux_shell
from utility import dependency_graph

import os
import shutil

class BuildCenter:

    # def __init__(self, build_config, build_list):
    #     self.build_config = build_config
    #     self.build_list = [service.lower() for service in build_list]
    
    def __init__(self, build_list):
        self.build_list = [service.lower() for service in build_list]
    
    
    def copy_dependency_folder(self, source, destination):
        print("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
        print("source ", source)
        print("destination", destination)
        print("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
        # if not os.path.exists(source):
        #     print("[DEBUG_LOG] {} folder path not exists".format(source))
        #     return None #TO-DO need raise error here
        # else:
        #     if os.path.exists(destination) and os.path.isdir(destination):
        #        os.removedirs(destination)
        #     shutil.copytree(source,destination)

    def clean_temp_folder(self, service_name):
        temp_generated_dir = os.path.join("src",service_name+"/generated")
        temp_dependency_dir = os.path.join("src",service_name+"/dependency")

        print("--------------------------------")
        print("[CAN_TEST_CLEAN]  temp_generated_dir="+temp_generated_dir)
        print("[CAN_TEST_CLEAN]  temp_dependency_dir="+temp_dependency_dir)
        print("--------------------------------")

        if os.path.exists(temp_generated_dir) and os.path.isdir(temp_generated_dir):
            os.removedirs(temp_generated_dir)

        if os.path.exists(temp_dependency_dir) and os.path.isdir(temp_dependency_dir):
            os.removedirs(temp_dependency_dir)

    def build_center(self):
        dirs = "src"
        
        # Initialize graph
        graph = dependency_graph.ServiceGraph()

        # Find services and map dockfile to services
        g = os.walk(dirs)

        for path, dir_list, file_list in g:
            if path == dirs:
                for service in dir_list:
                    graph.add_service(os.path.join(path, service), service)
            service_name = path.split(os.sep)
            service_name = service_name[-2] if len(service_name) > 1 else None
            for file_name in file_list:
                if file_name.endswith(".dockerfile"):
                    graph.add_docker_to_service(str(os.path.splitext(file_name)[0]), service_name)
        
        graph.dump()

        # Build dependency
        g = os.walk(dirs)
        for path, dir_list, file_list in g:
            service_name = path.split(os.sep)
            service_name = service_name[-2] if len(service_name) > 1 else None
            for file_name in file_list:
                if file_name.endswith(".dockerfile"):
                    with open(os.path.join(path, file_name), 'r') as fin:
                        for line in fin:
                            if line.strip().startswith("FROM"):
                                image = line.split()[1]
                                graph.add_dependency(graph.docker_to_service.get(image), service_name)
                elif file_name == "component.dep":
                    with open(os.path.join(path, file_name), "r") as fin:
                        for line in fin:
                            graph.add_dependency(line.strip(), service_name)

        # Build topology sequence
        services = graph.topology()
        for item in services:
            if not self.build_list or item in self.build_list:
                for inedge in graph.services[item].inedges:
                    copy_dependency_folder(os.path.join("src",inedge),os.path.join(graph.services[item].path,"dependency/"+inedge))
                graph.services[item].build_single_component()
        
        # Clean generated folder
        for item in services:
            clean_temp_folder(item)
