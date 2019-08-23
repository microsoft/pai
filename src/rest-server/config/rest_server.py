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

class RestServer:

    def __init__(self, cluster_configuration, service_configuration, default_service_configuraiton):
        self.cluster_configuration = cluster_configuration
        self.service_configuration = dict(default_service_configuraiton,
                                          **service_configuration)

    #### Fist check, ensure all the configured data in cluster_configuration, service_configuration, default_service_configuration is right. And nothing is miss.
    def validation_pre(self):
        machine_list = self.cluster_configuration['machine-list']
        if 'default-pai-admin-username' not in self.service_configuration:
            return False, '"default-pai-admin-username" is required in rest-server'
        if 'default-pai-admin-password' not in self.service_configuration:
            return False, '"default-pai-admin-password" is required in rest-server'
        if 'launcher-type' in self.service_configuration and self.service_configuration['launcher-type'] not in ['yarn', 'k8s']:
            return False, '"launcher-type" should be "yarn" or "k8s"'
        try:
            reservation_time = int(self.service_configuration['debugging-reservation-seconds'])
        except ValueError:
            return False, '"debugging-reservation-seconds" should be a positive integer.'
        if reservation_time <= 0:
            return False, '"debugging-reservation-seconds" should be a positive integer.'

        return True, None

    #### Generate the final service object model
    def run(self):
        # parse your service object model here, and return a generated dictionary

        machine_list = self.cluster_configuration['machine-list']
        master_ip = [host['hostip'] for host in machine_list if host.get('pai-master') == 'true'][0]
        server_port = self.service_configuration['server-port']

        service_object_model = dict()

        service_object_model['uri'] = 'http://{0}:{1}'.format(master_ip, server_port)
        service_object_model['server-port'] = server_port
        service_object_model['jwt-secret'] = self.service_configuration['jwt-secret']
        service_object_model['jwt-expire-time'] = self.service_configuration['jwt-expire-time']
        service_object_model['default-pai-admin-username'] = self.service_configuration['default-pai-admin-username']
        service_object_model['default-pai-admin-password'] = self.service_configuration['default-pai-admin-password']
        service_object_model['launcher-type'] = self.service_configuration['launcher-type']
        service_object_model['github-owner'] = self.service_configuration['github-owner']
        service_object_model['github-repository'] = self.service_configuration['github-repository']
        service_object_model['github-path'] = self.service_configuration['github-path']
        service_object_model['debugging-reservation-seconds'] = self.service_configuration['debugging-reservation-seconds']
        service_object_model['etcd-uris'] = ','.join('http://{0}:4001'.format(host['hostip'])
                                                     for host in machine_list
                                                     if host.get('k8s-role') == 'master')
        return service_object_model

    #### All service and main module (kubrenetes, machine) is generated. And in this check steps, you could refer to the service object model which you will used in your own service, and check its existence and correctness.
    def validation_post(self, cluster_object_model):
        if 'yarn-frameworklauncher' not in cluster_object_model or 'webservice' not in cluster_object_model['yarn-frameworklauncher']:
            return False, 'yarn-frameworklauncher.webservice is required'
        if 'hadoop-name-node' not in cluster_object_model or 'master-ip' not in cluster_object_model['hadoop-name-node']:
            return False, 'hadoop-name-node.master-ip is required'
        if 'hadoop-resource-manager' not in cluster_object_model or 'master-ip' not in cluster_object_model['hadoop-resource-manager']:
            return False, 'hadoop-resource-manager.master-ip is required'
        if 'kubernetes' not in cluster_object_model['layout'] or 'api-servers-url' not in cluster_object_model['layout']['kubernetes']:
            return False, 'kubernetes.api-servers-url is required'

        return True, None
