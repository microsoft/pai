# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

import copy

class DockerCache(object):
    def __init__(self, cluster_conf, service_conf, default_service_conf):
        self.cluster_conf = cluster_conf
        self.service_conf = dict(default_service_conf, **service_conf)

    def validation_pre(self):
        machine_list = self.cluster_conf['machine-list']
        if len([host for host in machine_list if host.get('pai-master') == 'true']) < 1:
            return False, '"pai-master=true" machine is required to deploy the docker-cache service'
        return True, None

    def run(self):
        result = copy.deepcopy(self.service_conf)
        return result

    def validation_post(self, conf):
        return True, None