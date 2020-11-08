# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

import copy

class MarketplaceDb(object):
    def __init__(self, cluster_conf, service_conf, default_service_conf):
        self.cluster_conf = cluster_conf
        self.service_conf = dict(default_service_conf, **service_conf)

    def validation_pre(self):
        machine_list = self.cluster_conf['machine-list']
        if len([host for host in machine_list if host.get('pai-master') == 'true']) < 1:
            return False, '"pai-master=true" machine is required to deploy the marketplace-db service'
        return True, None

    def run(self):
        result = copy.deepcopy(self.service_conf)
        machine_list = self.cluster_conf['machine-list']
        master_ip = [host['hostip'] for host in machine_list if host.get('pai-master') == 'true'][0]
        result['host'] = master_ip
        result['connection-str'] = 'postgresql://{}:{}@{}:{}/{}'.format(
            result['user'], result['passwd'], result['host'], result['port'], result['db'])
        return result

    def validation_post(self, conf):
        return True, None
