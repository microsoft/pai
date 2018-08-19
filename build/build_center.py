from __future__ import absolute_import
from __future__ import print_function
from utility import linux_shell

import os
import shutil
import datetime

class ServiceNode(object):

    def __init__(self, path, service_name):
        self.path = path
        self.service_name = service_name
        self.docker_files = list()
        self.inedges = list()
        self.outedges = list()


    def dump(self):
        print ("Path:{}\nName:{}\nInedge:{}\nOutedge:{}\n".format(
            self.path,
            self.service_name,
            self.inedges,
            self.outedges
        ))


    def build_single_component(self):
        pre_build = os.path.join(self.path, 'build/build-pre.sh')
        if os.path.exists(pre_build):
            print ("Pre", pre_build)
            #linux_shell.execute_shell(pre_build)


        for docker in self.docker_files:
            print ("Build", docker)

        post_build = os.path.join(self.path, 'build/build-post.sh')

        if os.path.exists(post_build):
            # linux_shell.execute_shell(post_build)
            print ("Post", post_build)


class ServiceGraph(object):

    def __init__(self):
        self.services = dict()
        self.docker_to_service = dict()


    def add_service(self, path, service_name):
        if not service_name in self.services:
            self.services[service_name] = ServiceNode(path, service_name)


    def add_docker_to_service(self, docker_name, service_name):
        self.docker_to_service[docker_name] = service_name
        self.services[service_name].docker_files.append(docker_name)


    def add_dependency(self, prev_service, succ_service):
        if prev_service in self.services and succ_service in self.services:
            self.services[prev_service].outedges.append(succ_service)
            self.services[succ_service].inedges.append(prev_service)
        

    def topology(self):
        prev_count = dict()
        ret = list()
        search_queue = list()
        for name, node in self.services.items():
            prev_count[name] = len(node.inedges)
            if prev_count[name] == 0:
                search_queue.append(name)

        while search_queue:
            current_node = search_queue[0]
            search_queue.pop(0)
            ret.append(current_node)
            for succ_service in self.services[current_node].outedges:
                prev_count[succ_service] -= 1
                if prev_count[succ_service] == 0:
                    search_queue.append(succ_service)
        return ret


    def dump(self):
        for _, service in self.services.items():
            service.dump()

def copy_dependency_folder(source, destination):
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

def clean_temp_folder(service_name):
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

def main():
    dirs = "src"

    starttime = datetime.datetime.now()
    
    # Initialize graph
    graph = ServiceGraph()

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
        for inedge in graph.services[item].inedges:
            copy_dependency_folder(os.path.join("src",inedge),os.path.join(graph.services[item].path,"dependency/"+inedge))
        graph.services[item].build_single_component()
    
    # Clean generated folder
    for item in services:
        clean_temp_folder(item)

    endtime = datetime.datetime.now()
    print("start time=" + str(starttime))
    print("end time=" + str(endtime))
    print (endtime - starttime)

if __name__ == "__main__":
    main()