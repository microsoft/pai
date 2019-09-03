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

class Pylon:

    def __init__(self, cluster_configuration, service_configuration, default_service_configuraiton):
        self.cluster_configuration = cluster_configuration
        self.service_configuration = dict(default_service_configuraiton,
                                          **service_configuration)

    #### Fist check, ensure all the configured data in cluster_configuration, service_configuration, default_service_configuration is right. And nothing is miss.
    def validation_pre(self):
        machine_list = self.cluster_configuration['machine-list']
        if len([host for host in machine_list if host.get('pai-master') == 'true']) != 1:
            return False, '1 and only 1 "pai-master=true" machine is required to deploy the rest server'
        return True, None

    #### Generate the final service object model
    def run(self):
        # parse your service object model here, and return a generated dictionary

        machine_list = self.cluster_configuration['machine-list']
        master_ip = [host['hostip'] for host in machine_list if host.get('pai-master') == 'true'][0]
        port = self.service_configuration['port']
        uri = 'http://{0}:{1}'.format(master_ip, port)
        uriHttps = 'https://{0}'.format(master_ip)
        if 'domain' in self.service_configuration:
            uri = 'http://{0}:{1}'.format(self.service_configuration['domain'], port)
            uriHttps = 'https://{0}'.format(self.service_configuration['domain'])

        webhdfs_legacy_port = self.service_configuration['webhdfs-legacy-port']
        ret = {
            'port': port,
            'uri': uri,
            'uri-https': uriHttps,
            'webhdfs-legacy-port': webhdfs_legacy_port,
        }
        if 'ssl' in self.service_configuration:
            ret['ssl'] = self.service_configuration['ssl']

        return ret

    #### All service and main module (kubrenetes, machine) is generated. And in this check steps, you could refer to the service object model which you will used in your own service, and check its existence and correctness.
    def validation_post(self, cluster_object_model):
        for (service, config) in (
            ('rest-server', 'uri'),
            ('hadoop-name-node', 'master-ip'),
            ('prometheus', 'url'),
            ('alert-manager', 'url'),
            # TODO
            #('kubernetes', 'dashboard-url'),
            ('hadoop-resource-manager', 'master-ip'),
            ('grafana', 'url'),
            ('webportal', 'uri'),
        ):
            if service not in cluster_object_model or config not in cluster_object_model[service]:
                return False, '{0}.{1} is required'.format(service, config)

        return True, None
