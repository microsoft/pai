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

import json
import urllib
import urlparse


class Webportal:

    def __init__(self, cluster_configuration, service_configuration, default_service_configuraiton):
        self.cluster_configuration = cluster_configuration
        self.service_configuration = dict(default_service_configuraiton,
                                          **service_configuration)
        self.service_configuration['plugins'] = []
        self.service_configuration['plugins'].extend(default_service_configuraiton.get('plugins', []))
        self.service_configuration['plugins'].extend(service_configuration.get('plugins', []))

    #### Fist check, ensure all the configured data in cluster_configuration, service_configuration, default_service_configuration is right. And nothing is miss.
    def validation_pre(self):
        machine_list = self.cluster_configuration['machine-list']
        if len([host for host in machine_list if host.get('pai-master') == 'true']) != 1:
            return False, '1 and only 1 "pai-master=true" machine is required to deploy the rest server'
        if self.service_configuration['log-type'] not in ['yarn', 'log-manager']:
            return False, '"log-type" should be yarn or log-manager'
        return True, None

    #### Generate the final service object model
    def run(self):
        # parse your service object model here, and return a generated dictionary

        def apply_config(plugin):
            uri = plugin['uri']
            if 'config' in plugin:
                # Python 2 only uses urlquote_plus in urlencode
                config_query = urllib.urlencode(plugin['config'], True).replace('+', '%20')
                uri = urlparse.urljoin(uri, '?' + config_query)
            return {
                'id': plugin.get('id'),
                'title': plugin['title'],
                'uri': uri,
            }

        machine_list = self.cluster_configuration['machine-list']
        master_ip = [host['hostip'] for host in machine_list if host.get('pai-master') == 'true'][0]
        server_port = self.service_configuration['server-port']
        log_type = self.service_configuration['log-type']
        uri = 'http://{0}:{1}'.format(master_ip, server_port)
        plugins = self.service_configuration['plugins']
        return {
            'server-port': server_port,
            'log-type': log_type,
            'uri': uri,
            'plugins': json.dumps([apply_config(plugin) for plugin in plugins]),
            'webportal-address': master_ip,
        }

    #### All service and main module (kubrenetes, machine) is generated. And in this check steps, you could refer to the service object model which you will used in your own service, and check its existence and correctness.
    def validation_post(self, cluster_object_model):
        for (service, config) in (
            ('rest-server', 'uri'),
            ('prometheus', 'url'),
            ('hadoop-resource-manager', 'master-ip'),
            ('grafana', 'url'),
            # TODO
            #('kubernetes', 'dashboard-url'),
            ('node-exporter', 'port'),
            ('prometheus', 'scrape_interval'),
        ):
            if service not in cluster_object_model or config not in cluster_object_model[service]:
                return False, '{0}.{1} is required'.format(service, config)

        return True, None
