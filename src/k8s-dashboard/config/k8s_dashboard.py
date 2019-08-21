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


class K8SDashboard(object):

    def __init__(self, cluster_conf, service_conf, default_service_conf):
        self.cluster_conf = cluster_conf

    def validation_pre(self):
        return True, None

    def validation_post(self, conf):
        return True, None

    def run(self):
        com_k8s_dashboard = {}

        com_k8s_dashboard['api-servers-url'] = self.cluster_conf['kubernetes']['api-servers-url']

        machine_list = self.cluster_conf['machine-list']
        master_nodename = [host['nodename'] for host in machine_list if host.get('pai-master') == 'true'][0]
        com_k8s_dashboard['dashboard-host'] = master_nodename
        master_address = [host['hostip'] for host in machine_list if host.get('pai-master') == 'true'][0]
        com_k8s_dashboard['dashboard-ip'] = master_address

        return com_k8s_dashboard