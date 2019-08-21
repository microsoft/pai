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

import sys
sys.path.append("../..")
from deployment.paiLibrary.common.kubernetes_handler import get_configmap, update_configmap
from deployment.k8sPaiLibrary.maintainlib import common


class KubernetesOperator(object):
    kubernetes_template = "../../deployment/k8sPaiLibrary/template/config.template"
    kube_config_path = "./.config"
    configmap_name = "exclude-file"
    configmap_data_key = "nodes"

    def __init__(self, master_ip):
        self.master_ip = master_ip
        self.setup_kubernetes_configfile(master_ip)

    def setup_kubernetes_configfile(self, api_servers_ip):

        template_data = common.read_template(self.kubernetes_template)
        dict_map = {
            "cluster_cfg": {"kubernetes": {"api-servers-ip": api_servers_ip}},
        }
        generated_data = common.generate_from_template_dict(template_data, dict_map)

        common.write_generated_file(generated_data, self.kube_config_path)

    def get_nodes(self):
        configmap_info = get_configmap(self.kube_config_path, self.configmap_name)
        nodes_str = configmap_info["data"][self.configmap_data_key]
        nodes = set(nodes_str.splitlines())
        return nodes

    def set_nodes(self, nodes):
        nodes = set(nodes)
        nodes_str = '\n'.join(nodes)
        data_dict = {self.configmap_data_key: nodes_str}
        update_configmap(self.kube_config_path, self.configmap_name, data_dict)
