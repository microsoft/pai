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

from __future__ import absolute_import
from __future__ import print_function

from utility import docker_process

import os
import datetime
import logging
import logging.config

class ServiceNode(object):

    def __init__(self, path, service_name):
        self.path = path
        self.service_name = service_name
        self.docker_files = list()
        self.inedges = list()
        self.outedges = list()

        self.logger = logging.getLogger(__name__)
        docker_process.setup_logger_config(self.logger)


    def dump(self):
        self.logger.info("Path:{}\nName:{}\nInedge:{}\nOutedge:{}\n".format(
            self.path,
            self.service_name,
            self.inedges,
            self.outedges
        ))


class ServiceGraph(object):

    def __init__(self):
        self.services = dict()
        self.image_to_service = dict()


    def add_service(self, path, service_name):
        if not service_name in self.services:
            self.services[service_name] = ServiceNode(path, service_name)


    def add_image_to_service(self, docker_name, service_name):
        self.image_to_service[docker_name] = service_name
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


    def extract_sub_graph(self, dest_nodes):
        if not dest_nodes:
            return None
        search_queue = dest_nodes
        ret = search_queue[:]
        while search_queue:
            current_node = search_queue[0]
            search_queue.pop(0)
            for prev_service in self.services[current_node].inedges:
                if not prev_service in ret:
                    ret.append(prev_service)
                    search_queue.append(prev_service)
        return ret
