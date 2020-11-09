# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

import copy

class MarketplaceWebportal(object):
    def __init__(self, cluster_conf, service_conf, default_service_conf):
        self.cluster_conf = cluster_conf
        self.service_conf = dict(default_service_conf, **service_conf)

    def validation_pre(self):
        machine_list = self.cluster_conf['machine-list']
        if len([host for host in machine_list if host.get('pai-master') == 'true']) < 1:
            return False, '"pai-master=true" machine is required to deploy the marketplace-webportal service'
        return True, None

    def run(self):
        result = copy.deepcopy(self.service_conf)
        machine_list = self.cluster_conf['machine-list']
        server_port = self.service_conf['server-port']
        api_port = self.service_conf['api-port']
        master_ip = [host['hostip'] for host in machine_list if host.get('pai-master') == 'true'][0]
        result['uri'] = 'http://{0}:{1}'.format(master_ip, server_port)
        if 'marketplace_api_uri' not in result:
            result['marketplace_api_uri'] = 'http://{0}:{1}/api'.format(master_ip, api_port)
        return result

    def validation_post(self, conf):
        return True, None
