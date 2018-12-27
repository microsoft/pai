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
import logging
import logging.config

from ...k8sPaiLibrary.maintainlib import common as pai_k8s_common


class Kubernetes:

    def __init__(self, cluster_configuration, kubernetes_configuration):
        self.logger = logging.getLogger(__name__)

        self.cluster_configuration = cluster_configuration
        self.kubernetes_configuration = kubernetes_configuration



    def get_k8s_master_machine(self):
        k8s_master_list = []
        for host in self.cluster_configuration["machine-list"]:
            if host["k8s-role"] == "master":
                k8s_master_list.append(host)
        return k8s_master_list



    def generate_etcd_ip_list(self, master_list):
        etcd_cluster_ips_peer = ""
        etcd_cluster_ips_server = ""
        separated = ""
        for infra in master_list:
            ip = infra['hostip']
            etcdid = infra['etcdid']
            ip_peer = "{0}=http://{1}:2380".format(etcdid, ip)
            ip_server = "http://{0}:4001".format(ip)

            etcd_cluster_ips_peer = etcd_cluster_ips_peer + separated + ip_peer
            etcd_cluster_ips_server = etcd_cluster_ips_server + separated + ip_server

            separated = ","

        return etcd_cluster_ips_peer, etcd_cluster_ips_server


    def get_k8s_dashboard_node_ip(self):
        hostip = ""
        for host in self.cluster_configuration["machine-list"]:
            if "dashboard" in host and host["dashboard"] == "true":
                hostip = host["hostip"]
                break
        if hostip == "":
            print("no machine labeled with dashboard = true")
            sys.exit(1)

        return hostip



    def run(self):
        k8s_cfg = self.kubernetes_configuration["kubernetes"]
        com_kubernetes = dict()

        com_kubernetes["cluster-dns"] = k8s_cfg["cluster-dns"]
        com_kubernetes["api-servers-ip"] = k8s_cfg["load-balance-ip"]
        com_kubernetes["api-servers-port"] = k8s_cfg["api-servers-port"] if ("api-servers-port" in k8s_cfg) else "8080"
        com_kubernetes["api-servers-http-schema"] = k8s_cfg["api-servers-http-schema"] if ("api-servers-http-schema" in k8s_cfg) else "http"
        com_kubernetes["api-servers-url"] = "{0}://{1}:{2}".format(com_kubernetes["api-servers-http-schema"], k8s_cfg["load-balance-ip"], com_kubernetes["api-servers-port"])
        com_kubernetes["docker-registry"] = k8s_cfg["docker-registry"]
        com_kubernetes["hyperkube-version"] = k8s_cfg["hyperkube-version"]
        com_kubernetes["etcd-version"] = k8s_cfg["etcd-version"]
        com_kubernetes["service-cluster-ip-range"]  = k8s_cfg["service-cluster-ip-range"]
        com_kubernetes["apiserver-version"] = k8s_cfg["apiserver-version"]
        com_kubernetes["storage-backend"] = k8s_cfg["storage-backend"]
        com_kubernetes["kube-scheduler-version"] = k8s_cfg["kube-scheduler-version"]
        com_kubernetes["kube-controller-manager-version"] = k8s_cfg["kube-controller-manager-version"]
        com_kubernetes["dashboard-version"] = k8s_cfg["dashboard-version"]
        com_kubernetes["dashboard-host"] = self.get_k8s_dashboard_node_ip()
        if "etcd-data-path" not in k8s_cfg:
            com_kubernetes["etcd-data-path"] = "/var/etcd/data"
        else:
            com_kubernetes["etcd-data-path"] = k8s_cfg["etcd-data-path"]

        com_kubernetes["qos-switch"] = k8s_cfg["qos-switch"] if ("qos-switch" in k8s_cfg) else "true"

        k8s_master_list = self.get_k8s_master_machine()
        etcd_cluster_ips_peer, etcd_cluster_ips_server = self.generate_etcd_ip_list(k8s_master_list)

        # ETCD will communicate with each other through this address.
        com_kubernetes['etcd_cluster_ips_peer'] = etcd_cluster_ips_peer
        # Other service will write and read data through this address.
        com_kubernetes['etcd_cluster_ips_server'] = etcd_cluster_ips_server
        com_kubernetes['etcd-initial-cluster-state'] = 'new'

        master_list = []
        worker_list = []
        proxy_list = []

        for host in self.cluster_configuration["machine-list"]:
            if host["k8s-role"] == "master":
                master_list.append(host["hostname"])
            elif host["k8s-role"] == "worker":
                worker_list.append(host["hostname"])
            elif host["k8s-role"] == "proxy":
                proxy_list.append(host["hostname"])

        if len(master_list) != 0:
            com_kubernetes["master-list"] = master_list
        if len(worker_list) != 0:
            com_kubernetes["worker-list"] = worker_list
        if len(proxy_list) != 0:
            com_kubernetes["proxy-list"] = proxy_list

        return com_kubernetes



    def validation_pre(self):
        k8s_cfg = self.kubernetes_configuration["kubernetes"]

        if "cluster-dns" not in k8s_cfg:
            return False, "cluster-dns is miss in kubernetes-configuration -> kubernetes. You can get this value with the command [cat /etc/resolv.conf]"
        if pai_k8s_common.ipv4_address_validation(k8s_cfg["cluster-dns"]) is False:
            return False, "cluster-dns in kubernetes-configuration is not a valid ipv4 address."

        if "load-balance-ip" not in k8s_cfg:
            return False, "load-balance-ip is miss in kubernetes-configuration -> kubernetes."
        if pai_k8s_common.ipv4_address_validation(k8s_cfg["load-balance-ip"]) is False:
            return False, "load-balance-ip in kubernetes-configuration is not a valid ipv4 address"

        if "service-cluster-ip-range" not in k8s_cfg:
            return False, "service-cluster-ip-range is miss in kubernetes-configuration -> kubernetes."
        if pai_k8s_common.cidr_validation(k8s_cfg["service-cluster-ip-range"]) is False:
            return False, "service-cluster-ip-range in kubernetes-configuration is not a valid CIDR."

        if "storage-backend" not in k8s_cfg:
            return False, "storage-backend is miss in kubernetes-configuration -> kubernetes."
        if k8s_cfg["storage-backend"] != "etcd3" and k8s_cfg["storage-backend"] != "etcd2":
            return False, "storage-backend in kubernetes-configuration is not valid, please set corresponding value [etcd2 or etcd3] according to your etcd version."

        if "docker-registry" not in k8s_cfg:
            return False, "docker-registry is miss in kubernetes-configuration -> kubernetes."

        if "hyperkube-version" not in k8s_cfg:
            return False, "hyperkube-version is miss in kubernetes-configuration -> kubernetes."

        if "etcd-version" not in k8s_cfg:
            return False, "etcd-version is miss in kubernetes-configuration -> kubernetes."

        if "apiserver-version" not in k8s_cfg:
            return False, "apiserver-version is miss in kuberentes-configuraiton -> kubernetes."

        if "kube-scheduler-version" not in k8s_cfg:
            return False, "kube-scheduler-version is miss in kubernetes-configuration -> kubernetes."

        if "kube-controller-manager-version" not in k8s_cfg:
            return False, "kube-controller-manager-version is miss in kubernetes-configuration -> kubernetes."

        if "dashboard-version" not in k8s_cfg:
            return False, "dashboard-version is miss in kuberentes-configuration -> kubernetes."

        return True, None



    def validation_post(self, cluster_object_model):
        return True, None
