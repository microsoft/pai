from __future__ import absolute_import
from __future__ import print_function

import os

class ServiceNode(object):
    
    def __init__(self, path, service_name):
        self.path = path
        self.service_name = service_name
        self.docker_files = list()
        self.inedges = list()
        self.outedges = list()

    def dump(self):
        print ("Path:{}\nName:{}\nInedge:{}\nOutedge:{}".format(
            self.path,
            self.service_name,
            self.inedges,
            self.outedges
        ))


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
        
        else:
            print ("Error servcies dependency {} to {}.".format(prev_service, succ_service))


    def dump(self):
        for _, service in self.services.items():
            service.dump()

def main():
    dirs = "src"

    graph = ServiceGraph()
    
    # Find Services and map dockfile to services
    g = os.walk(dirs)
    for path, dir_list, file_list in g:
        if path == dirs:
            for service in dir_list:
                graph.add_service(path, service)        
        service_name = path.split(os.sep)
        service_name = service_name[-2] if len(service_name) > 1 else None
        for file_name in file_list:
            if file_name.endswith(".dockerfile"):
                graph.add_docker_to_service(file_name, service_name)

    # Build Dependency
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
                            graph.add_dependency(image, service_name)
            elif file_name == "component.dep":
                with open(os.path.join(path, file_name), "r") as fin:
                    for line in fin:
                        graph.add_dependency(line.strip(), service_name)

    # Build topology sequence
    def topology(graph):
        prev_count = dict()
        ret = list()
        search_queue = list()
        for name, node in graph.services.items():
            prev_count[name] = len(node.inedges)
            if prev_count[name] == 0:
                search_queue.append(name)
        
        while search_queue:
            current_node = search_queue[0]
            search_queue.pop(0)
            ret.append(current_node)
            for succ_service in graph.services[current_node].outedges:
                prev_count[succ_service] -= 1
                if prev_count[succ_service] == 0:
                    search_queue.append(succ_service)
        return ret

    print ("List: {}".format(topology(graph)))

    # graph.dump()

if __name__ == "__main__":
    main()