#!/usr/bin/env python
#
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

import copy
import logging


class Postgresql(object):
    def __init__(self, cluster_conf, service_conf, default_service_conf):
        self.cluster_conf = cluster_conf
        self.service_conf = self.merge_service_configuration(service_conf, default_service_conf)
        self.logger = logging.getLogger(__name__)

    @staticmethod
    def merge_service_configuration(overwrite_srv_cfg, default_srv_cfg):
        if overwrite_srv_cfg is None:
            return default_srv_cfg
        srv_cfg = default_srv_cfg.copy()
        for k in overwrite_srv_cfg:
            srv_cfg[k] = overwrite_srv_cfg[k]
        return srv_cfg

    def validation_pre(self):
        if self.service_conf['enable']:
            machine_list = self.cluster_conf['machine-list']
            if len([host for host in machine_list if host.get('pai-master') == 'true']) < 1:
                return False, '"pai-master=true" machine is required to deploy the postgresql service'
        return True, None

    def run(self):
        result = copy.deepcopy(self.service_conf)
        if self.service_conf['enable']:
            machine_list = self.cluster_conf['machine-list']
            master_ip = [host['hostip'] for host in machine_list if host.get('pai-master') == 'true'][0]
            result['host'] = master_ip
            result['connection-str'] = 'postgresql://{}:{}@{}:{}/{}'.format(
                result['user'], result['passwd'], result['host'], result['port'], result['db'])
        return result

    def validation_post(self, conf):
        return True, None
