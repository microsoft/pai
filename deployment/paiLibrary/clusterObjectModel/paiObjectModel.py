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

from __future__ import print_function
#
import sys
import logging
import logging.config
import json

from ..common import linux_shell



class paiObjectModel:



    def __init__(self, configurationMap):

        self.rawData = configurationMap
        self.objectModel = dict()

        self.logger = logging.getLogger(__name__)



    def validata(self):

        pass



    def k8sParse(self):

        k8sDict = dict()

        # section : clusterID

        k8sDict["clusterID"] = self.rawData["serviceConfiguration"]["cluster"]["clusterid"]

        # section : clusterinfo

        k8sDict["clusterinfo"] = self.rawData["kubernetesConfiguration"]["kubernetes"]
        k8sDict["clusterinfo"]["api-servers-ip"] = k8sDict["clusterinfo"]["load-balance-ip"]
        k8sDict["clusterinfo"]["dockerregistry"] = k8sDict["clusterinfo"]["docker-registry"]
        k8sDict["clusterinfo"]["hyperkubeversion"] = k8sDict["clusterinfo"]["hyperkube-version"]
        k8sDict["clusterinfo"]["etcdversion"] = k8sDict["clusterinfo"]["etcd-version"]
        k8sDict["clusterinfo"]["apiserverversion"] = k8sDict["clusterinfo"]["apiserver-version"]
        k8sDict["clusterinfo"]["kubeschedulerversion"] = k8sDict["clusterinfo"]["kube-scheduler-version"]
        k8sDict["clusterinfo"]["kubecontrollermanagerversion"] = k8sDict["clusterinfo"]["kube-controller-manager-version"]
        k8sDict["clusterinfo"]["dashboard_version"] = k8sDict["clusterinfo"]["dashboard-version"]
        if "etcd-data-path" not in k8sDict["clusterinfo"]:
            k8sDict["clusterinfo"]["etcd-data-path"] = "/var/etcd/data"


        # section : component_list

        k8sDict["component_list"] = self.rawData["k8sRoleDefinition"]["component-list"]

        # section : remote_deployment

        k8sDict["remote_deployment"] = self.rawData["k8sRoleDefinition"]["k8s-role"]
        k8sDict["remote_deployment"]["master"]["listname"] = "mastermachinelist"
        k8sDict["remote_deployment"]["worker"]["listname"] = "workermachinelist"
        k8sDict["remote_deployment"]["proxy"]["listname"] = "proxymachinelist"

        # section : mastermachinelist & workermachinelist & proxymachinelist

        masterDict = dict()
        workerDict = dict()
        proxyDict = dict()

        for host in self.rawData["clusterConfiguration"]["machine-list"]:
            if "dashboard" in host:
                k8sDict["clusterinfo"]["dashboard-host"] = host["hostip"]

            if host["k8s-role"] == "master":

                masterDict[host["hostname"]] = host
                if "nodename" not in masterDict[host["hostname"]]:
                    masterDict[host["hostname"]]["nodename"] = host["hostip"]

                if "sshport" not in host:
                    masterDict[host["hostname"]]["sshport"] = \
                        self.rawData["clusterConfiguration"]["default-machine-properties"]["sshport"]

                if "password" not in host:
                    masterDict[host["hostname"]]["password"] = \
                    self.rawData["clusterConfiguration"]["default-machine-properties"]["password"]

                if "username" not in host:
                    masterDict[host["hostname"]]["username"] = \
                    self.rawData["clusterConfiguration"]["default-machine-properties"]["username"]

            if host["k8s-role"] == "worker":

                workerDict[host["hostname"]] = host
                if "nodename" not in workerDict[host["hostname"]]:
                    workerDict[host["hostname"]]["nodename"] = host["hostip"]

                if "sshport" not in host:
                    workerDict[host["hostname"]]["sshport"] = \
                        self.rawData["clusterConfiguration"]["default-machine-properties"]["sshport"]

                if "password" not in host:
                    workerDict[host["hostname"]]["password"] = \
                    self.rawData["clusterConfiguration"]["default-machine-properties"]["password"]

                if "username" not in host:
                    workerDict[host["hostname"]]["username"] = \
                    self.rawData["clusterConfiguration"]["default-machine-properties"]["username"]

            if host["k8s-role"] == "proxy":

                proxyDict[host["hostname"]] = host
                if "nodename" not in proxyDict[host["hostname"]]:
                    proxyDict[host["hostname"]]["nodename"] = host["hostip"]

                if "sshport" not in host:
                    proxyDict[host["hostname"]]["sshport"] = \
                        self.rawData["clusterConfiguration"]["default-machine-properties"]["sshport"]

                if "password" not in host:
                    proxyDict[host["hostname"]]["password"] = \
                    self.rawData["clusterConfiguration"]["default-machine-properties"]["password"]

                if "username" not in host:
                    proxyDict[host["hostname"]]["username"] = \
                    self.rawData["clusterConfiguration"]["default-machine-properties"]["username"]

        if len(masterDict) != 0:
            k8sDict["mastermachinelist"] = masterDict
        if len(workerDict) != 0:
            k8sDict["workermachinelist"] = workerDict
        if len(proxyDict) != 0:
            k8sDict["proxymachinelist"] = proxyDict


        master_list = k8sDict['mastermachinelist']
        etcd_cluster_ips_peer, etcd_cluster_ips_server = self.generate_etcd_ip_list(master_list)

        # ETCD will communicate with each other through this address.
        k8sDict['clusterinfo']['etcd_cluster_ips_peer'] = etcd_cluster_ips_peer
        # Other service will write and read data through this address.
        k8sDict['clusterinfo']['etcd_cluster_ips_server'] = etcd_cluster_ips_server
        k8sDict['clusterinfo']['etcd-initial-cluster-state'] = 'new'

        return k8sDict



    def serviceParse(self):

        serviceDict = dict()

        # section : clusterID

        serviceDict["clusterID"] = self.rawData["serviceConfiguration"]["cluster"]["clusterid"]

        # section : clusterinfo:

        serviceDict["clusterinfo"] = self.rawData["serviceConfiguration"]["cluster"]
        serviceDict["clusterinfo"]["dataPath"] = serviceDict["clusterinfo"]["data-path"]
        serviceDict["clusterinfo"]["dockerregistryinfo"] = serviceDict["clusterinfo"]["docker-registry-info"]
        serviceDict["clusterinfo"]["dockerregistryinfo"]["docker_namespace"] = \
            serviceDict["clusterinfo"]["docker-registry-info"]["docker-namespace"]
        serviceDict["clusterinfo"]["dockerregistryinfo"]["docker_registry_domain"] = \
            serviceDict["clusterinfo"]["docker-registry-info"]["docker-registry-domain"]
        if "docker-username" in serviceDict["clusterinfo"]["docker-registry-info"]:
            serviceDict["clusterinfo"]["dockerregistryinfo"]["docker_username"] = \
                serviceDict["clusterinfo"]["docker-registry-info"]["docker-username"]
        else:
            serviceDict["clusterinfo"]["dockerregistryinfo"]["docker_username"] = None
        if "docker-password" in serviceDict["clusterinfo"]["docker-registry-info"]:
            serviceDict["clusterinfo"]["dockerregistryinfo"]["docker_password"] = \
                serviceDict["clusterinfo"]["docker-registry-info"]["docker-password"]
        else:
            serviceDict["clusterinfo"]["dockerregistryinfo"]["docker_password"] = None
        serviceDict["clusterinfo"]["dockerregistryinfo"]["docker_tag"] = \
            serviceDict["clusterinfo"]["docker-registry-info"]["docker-tag"]
        serviceDict["clusterinfo"]["dockerregistryinfo"]["secretname"] = \
            serviceDict["clusterinfo"]["docker-registry-info"]["secret-name"]

        # section : hadoop

        serviceDict["clusterinfo"]["hadoopinfo"] = \
            self.rawData["serviceConfiguration"]["hadoop"]
        serviceDict["clusterinfo"]["hadoopinfo"]["custom_hadoop_binary_path"] = \
            serviceDict["clusterinfo"]["hadoopinfo"]["custom-hadoop-binary-path"]
        serviceDict["clusterinfo"]["hadoopinfo"]["configmapname"] = "hadoop-configuration"
        serviceDict["clusterinfo"]["hadoopinfo"]["hadoop_vip"] = self.getMasterIP()


        # section : virtualClusters

        if "virtualClusters" in self.rawData["serviceConfiguration"]["hadoop"]:
            serviceDict["clusterinfo"]["virtualClusters"] = self.rawData["serviceConfiguration"]["hadoop"]["virtualClusters"]
        else:
            serviceDict["clusterinfo"]["virtualClusters"] = {}


        # section : frameworklauncher

        serviceDict["clusterinfo"]["frameworklauncher"] = \
            self.rawData["serviceConfiguration"]["frameworklauncher"]
        serviceDict["clusterinfo"]["frameworklauncher"]["frameworklauncher_port"] = \
            serviceDict["clusterinfo"]["frameworklauncher"]["frameworklauncher-port"]
        serviceDict["clusterinfo"]["frameworklauncher"]["frameworklauncher_vip"] = self.getMasterIP()

        # section : restserverinfo

        serviceDict["clusterinfo"]["restserverinfo"] = \
            self.rawData["serviceConfiguration"]["restserver"]
        serviceDict["clusterinfo"]["restserverinfo"]["src_path"] = "../rest-server/"
        serviceDict["clusterinfo"]["restserverinfo"]["webservice_uri"] = self.getWebServiceUri()
        serviceDict["clusterinfo"]["restserverinfo"]["hdfs_uri"] = self.getHdfsUri()
        serviceDict["clusterinfo"]["restserverinfo"]["webhdfs_uri"] = self.getWebhdfsUri()
        serviceDict["clusterinfo"]["restserverinfo"]["server_port"] = \
            serviceDict["clusterinfo"]["restserverinfo"]["server-port"]
        serviceDict["clusterinfo"]["restserverinfo"]["jwt_secret"] = \
            serviceDict["clusterinfo"]["restserverinfo"]["jwt-secret"]
        serviceDict["clusterinfo"]["restserverinfo"]["default_pai_admin_password"] = \
            serviceDict["clusterinfo"]["restserverinfo"]["default-pai-admin-password"]
        serviceDict["clusterinfo"]["restserverinfo"]["default_pai_admin_username"] = \
            serviceDict["clusterinfo"]["restserverinfo"]["default-pai-admin-username"]
        serviceDict["clusterinfo"]["restserverinfo"]["github_owner"] = \
            serviceDict["clusterinfo"]["restserverinfo"].get("github-owner")
        serviceDict["clusterinfo"]["restserverinfo"]["github_repository"] = \
            serviceDict["clusterinfo"]["restserverinfo"].get("github-repository")
        serviceDict["clusterinfo"]["restserverinfo"]["github_path"] = \
            serviceDict["clusterinfo"]["restserverinfo"].get("github-path")
        serviceDict["clusterinfo"]["restserverinfo"]["etcd_uri"] = self.getEtcdUri()
        serviceDict["clusterinfo"]["restserverinfo"]["yarn_uri"] = self.getYarnWebPortalUri()

        # section: webportal

        serviceDict["clusterinfo"]["webportalinfo"] = \
            self.rawData["serviceConfiguration"]["webportal"]
        serviceDict["clusterinfo"]["webportalinfo"]["rest_server_uri"] = self.getRestServerUri()
        serviceDict["clusterinfo"]["webportalinfo"]["prometheus_uri"] =self.getPrometheusUri()
        serviceDict["clusterinfo"]["webportalinfo"]["grafana_uri"] = self.getGrafanaUri()
        serviceDict["clusterinfo"]["webportalinfo"]["k8s_dashboard_uri"] = self.getK8sDashboardUri()
        serviceDict["clusterinfo"]["webportalinfo"]["k8s_api_server_uri"] = self.getK8sApiServerUri()
        serviceDict["clusterinfo"]["webportalinfo"]["server_port"] = \
            self.rawData["serviceConfiguration"]["webportal"]["server-port"]
        serviceDict["clusterinfo"]["webportalinfo"]["yarn_web_portal_uri"] = self.getYarnWebPortalUri()
        serviceDict["clusterinfo"]["webportalinfo"]["plugins"] = json.dumps(self.getPaiWebportalPlugins())

        # section: grafana

        serviceDict["clusterinfo"]["grafanainfo"] = \
            self.rawData["serviceConfiguration"]["grafana"]
        serviceDict["clusterinfo"]["grafanainfo"]["grafana_url"] = "http://{0}".format(self.getMasterIP())
        serviceDict["clusterinfo"]["grafanainfo"]["grafana_port"] = \
            serviceDict["clusterinfo"]["grafanainfo"]["grafana-port"]

        # section: prometheus

        serviceDict["clusterinfo"]["prometheusinfo"] = \
            self.rawData["serviceConfiguration"]["prometheus"]
        serviceDict["clusterinfo"]["prometheusinfo"]["prometheus_url"] = "http://{0}".format(self.getMasterIP())
        serviceDict["clusterinfo"]["prometheusinfo"]["prometheus_port"] = \
            serviceDict["clusterinfo"]["prometheusinfo"]["prometheus-port"]
        serviceDict["clusterinfo"]["prometheusinfo"]["node_exporter_port"] = \
            serviceDict["clusterinfo"]["prometheusinfo"]["node-exporter-port"]

        # template can check clusterinfo['prometheusinfo']['alerting'] to see if alert is enabled
        if serviceDict["clusterinfo"]["prometheusinfo"].get("alerting") is not None:
            serviceDict["clusterinfo"]["prometheusinfo"]["alerting"]["alert-manager-hosts"] = self.getMasterIP()

        # section

        serviceDict["clusterinfo"]["pyloninfo"] = \
            self.rawData["serviceConfiguration"]["pylon"]
        serviceDict["clusterinfo"]["pyloninfo"]["rest_server_uri"] = self.getRestServerUri()
        serviceDict["clusterinfo"]["pyloninfo"]["k8s_api_server_uri"] = self.getK8sApiServerUri()
        serviceDict["clusterinfo"]["pyloninfo"]["webhdfs_uri"] = self.getWebhdfsUri()
        serviceDict["clusterinfo"]["pyloninfo"]["webhdfs_legacy_port"] = 50070
        serviceDict["clusterinfo"]["pyloninfo"]["prometheus_uri"] = self.getPrometheusUri()
        serviceDict["clusterinfo"]["pyloninfo"]["k8s_dashboard_uri"] = self.getK8sDashboardUri()
        serviceDict["clusterinfo"]["pyloninfo"]["yarn_web_portal_uri"] = self.getYarnWebPortalUri()
        serviceDict["clusterinfo"]["pyloninfo"]["grafana_uri"] = self.getGrafanaUri()
        serviceDict["clusterinfo"]["pyloninfo"]["pai_web_portal_uri"] = self.getPaiWebPortalUri()


        # section: machineinfo

        serviceDict["machineinfo"] = self.rawData["clusterConfiguration"]["machine-sku"]


        # section: machinelist

        serviceDict["machinelist"] = dict()

        for host in self.rawData["clusterConfiguration"]["machine-list"]:
            hostname = host["hostname"]
            host["nodename"] = host["hostip"]
            host["machinetype"] = host["machine-type"]
            host["ip"] = host["hostip"]

            serviceDict["machinelist"][hostname] = host

        # section: drivers
        if "drivers" in self.rawData["serviceConfiguration"]:
            serviceDict["clusterinfo"]["driversinfo"] = \
                self.rawData["serviceConfiguration"]["drivers"]
            if "version" in self.rawData["serviceConfiguration"]["drivers"]:
                serviceDict["clusterinfo"]["driversinfo"]["version"] = \
                    str(self.rawData["serviceConfiguration"]["drivers"]["version"])
        else:
            serviceDict["clusterinfo"]["driversinfo"] = dict()

        if "version" not in serviceDict["clusterinfo"]["driversinfo"]:
            serviceDict["clusterinfo"]["driversinfo"]["version"] = "384.111"


        serviceDict["clusterinfo"]["drivers"] = {"set-nvidia-runtime": False}
        if self.rawData["serviceConfiguration"].get("drivers") is not None:
            driver_conf = self.rawData["serviceConfiguration"]["drivers"]
            if driver_conf.get("set-nvidia-runtime") is not None:
                serviceDict["clusterinfo"]["drivers"]["set-nvidia-runtime"] = \
                        driver_conf["set-nvidia-runtime"]

        self.generate_secret_base64code(serviceDict["clusterinfo"]["dockerregistryinfo"])
        self.generate_docker_credential(serviceDict["clusterinfo"]["dockerregistryinfo"])
        self.generate_image_url_prefix(serviceDict["clusterinfo"]["dockerregistryinfo"])

        if 'docker_tag' not in serviceDict['clusterinfo']['dockerregistryinfo']:
            serviceDict['clusterinfo']['dockerregistryinfo']['docker_tag'] = 'latest'

        self.generate_configuration_of_hadoop_queues(serviceDict)

        return serviceDict



    def getYarnWebPortalUri(self):

        ip = self.getMasterIP()
        port = "8088"
        ret = "http://{0}:{1}".format(ip, port)
        return ret


    def getPaiWebPortalUri(self):

        ip = self.getMasterIP()
        port = self.rawData["serviceConfiguration"]["webportal"]["server-port"]
        ret = "http://{0}:{1}".format(ip, port)
        return ret



    def getK8sApiServerUri(self):

        ip = self.rawData["kubernetesConfiguration"]["kubernetes"]["load-balance-ip"]
        ret = "http://{0}:{1}".format(ip, 8080)
        return ret



    def getK8sDashboardUri(self):

        vip = ""

        for host in self.rawData["clusterConfiguration"]["machine-list"]:
            if "dashboard" in host and host["dashboard"] == "true":
                vip = host["hostip"]
                break

        if vip == "":
            print("no machine labeled with dashboard = true")
            sys.exit(1)

        ret = "http://{0}:9090".format(vip)
        return ret




    def getGrafanaUri(self):

        vip = self.getMasterIP()
        port = self.rawData["serviceConfiguration"]["grafana"]["grafana-port"]
        ret = "http://{0}:{1}".format(vip, str(port))
        return ret



    def getPrometheusUri(self):

        vip = self.getMasterIP()
        port = self.rawData["serviceConfiguration"]["prometheus"]["prometheus-port"]
        ret = "http://{0}:{1}".format(vip, str(port))
        return ret



    def getRestServerUri(self):

        vip = self.getMasterIP()
        port = self.rawData["serviceConfiguration"]["restserver"]["server-port"]
        ret = "http://{0}:{1}".format(vip, str(port))
        return ret



    def getEtcdUri(self):

        ret = ""
        deli = ""
        for host in self.rawData["clusterConfiguration"]["machine-list"]:
            if "k8s-role" in host and host["k8s-role"] == "master":
                tmp = "http://{0}:4001".format(host["hostip"])
                ret = ret + deli
                ret = ret + tmp
                deli = ","

        if ret == "":
            print("No machine labeled with k8s-role = master!")
            sys.exit(1)

        return ret



    def getWebServiceUri(self):

        vip = self.getMasterIP()
        port = self.rawData["serviceConfiguration"]["frameworklauncher"]["frameworklauncher_port"]
        ret = "http://{0}:{1}".format(vip, str(port))
        return ret



    def getWebhdfsUri(self):

        vip = self.getMasterIP()
        port = "5070"
        ret = "http://{0}:{1}".format(vip, str(port))
        return ret



    def getHdfsUri(self):

        vip = self.getMasterIP()
        port = "9000"
        ret = "hdfs://{0}:{1}".format(vip, str(port))
        return ret



    def getPaiWebportalPlugins(self):

        builtinPlugins = [{
            'title': 'Marketplace',
            'uri': '/scripts/plugins/marketplace.bundle.js'
        }]
        configuredPlugins = self.rawData["serviceConfiguration"]["webportal"].get("plugins", [])

        plugins = []
        plugins.extend(builtinPlugins)
        plugins.extend(configuredPlugins)

        return plugins


    def getMasterIP(self):

        for host in self.rawData["clusterConfiguration"]["machine-list"]:
            if "pai-master" in host and host["pai-master"] == "true":
                return host["hostip"]

        print("At least one and only one machine should be labeled with pai-master = true")
        print("please modify your cluster configuration, thanks.")

        sys.exit(1)



    def parseConfiguration(self):

        self.objectModel["k8s"] = self.k8sParse()
        self.objectModel["service"] = self.serviceParse()



    def generate_etcd_ip_list(self, master_list):

        etcd_cluster_ips_peer = ""
        etcd_cluster_ips_server = ""
        separated = ""
        for infra in master_list:
            ip = master_list[infra]['hostip']
            etcdid = master_list[infra]['etcdid']
            ip_peer = "{0}=http://{1}:2380".format(etcdid, ip)
            ip_server = "http://{0}:4001".format(ip)

            etcd_cluster_ips_peer = etcd_cluster_ips_peer + separated + ip_peer
            etcd_cluster_ips_server = etcd_cluster_ips_server + separated + ip_server

            separated = ","

        return etcd_cluster_ips_peer, etcd_cluster_ips_server



    def generate_configuration_of_hadoop_queues(self, cluster_config):
        """The method to configure VCs:
          - Each VC correspoonds to a Hadoop queue.
          - Each VC will be assigned with (capacity / total_capacity * 100%) of the resources in the system.
          - The system will automatically create the 'default' VC with 0 capacity, if 'default' VC has not
            been explicitly specified in the configuration file.
          - If all capacities are 0, resources will be split evenly to each VC.
        """
        hadoop_queues_config = {}
        #
        virtual_clusters_config = cluster_config["clusterinfo"]["virtualClusters"]
        if "default" not in virtual_clusters_config:
            self.logger.warn("VC 'default' has not been explicitly specified. " +
                        "Auto-recoverd by adding it with 0 capacity.")
            virtual_clusters_config["default"] = {
                "description": "Default VC.",
                "capacity": 0
            }
        total_capacity = 0
        for vc_name in virtual_clusters_config:
            if virtual_clusters_config[vc_name]["capacity"] < 0:
                self.logger.warn("Capacity of VC '%s' (=%f) should be a positive number. " \
                            % (vc_name, virtual_clusters_config[vc_name]["capacity"]) +
                            "Auto-recoverd by setting it to 0.")
                virtual_clusters_config[vc_name]["capacity"] = 0
            total_capacity += virtual_clusters_config[vc_name]["capacity"]
        if float(total_capacity).is_integer() and total_capacity == 0:
            self.logger.warn("Total capacity (=%d) should be a positive number. " \
                        % (total_capacity) +
                        "Auto-recoverd by splitting resources to each VC evenly.")
            for vc_name in virtual_clusters_config:
                virtual_clusters_config[vc_name]["capacity"] = 1
                total_capacity += 1
        for vc_name in virtual_clusters_config:
            hadoop_queues_config[vc_name] = {
                "description": virtual_clusters_config[vc_name]["description"],
                "weight": float(virtual_clusters_config[vc_name]["capacity"]) / float(total_capacity) * 100
            }
        #
        cluster_config["clusterinfo"]["hadoopQueues"] = hadoop_queues_config



    def login_docker_registry(self, docker_registry, docker_username, docker_password):

        shell_cmd = "docker login -u {0} -p {1} {2}".format(docker_username, docker_password, docker_registry)
        error_msg = "docker registry login error"
        linux_shell.execute_shell(shell_cmd, error_msg)
        self.logger.info("docker registry login successfully")



    def generate_secret_base64code(self, docker_info):

        domain = docker_info["docker_registry_domain"] and str(docker_info["docker_registry_domain"])
        username = docker_info["docker_username"] and str(docker_info["docker_username"])
        passwd = docker_info["docker_password"] and str(docker_info["docker_password"])

        if domain == "public":
            domain = ""

        if username and passwd:
            self.login_docker_registry(domain, username, passwd)

            base64code = linux_shell.execute_shell_with_output(
                "cat ~/.docker/config.json | base64",
                "Failed to base64 the docker's config.json"
            )
        else:
            self.logger.info("docker registry authentication not provided")

            base64code = "{}".encode("base64")

        docker_info["base64code"] = base64code.replace("\n", "")



    def generate_docker_credential(self, docker_info):

        username = docker_info["docker_username"] and str(docker_info["docker_username"])
        passwd = docker_info["docker_password"] and str(docker_info["docker_password"])

        if username and passwd:
            credential = linux_shell.execute_shell_with_output(
                "cat ~/.docker/config.json",
                "Failed to get the docker's config.json"
            )
        else:
            credential = "{}"

        docker_info["credential"] = credential



    def generate_image_url_prefix(self, docker_info):

        domain = str(docker_info["docker_registry_domain"])
        namespace = str(docker_info["docker_namespace"])

        if domain != "public":
            prefix = "{0}/{1}/".format(domain, namespace)
        else:
            prefix = "{0}/".format(namespace)

        docker_info["prefix"] = prefix



    def getDict(self):

        return self.objectModel



    def execute(self):

        self.validata()
        self.parseConfiguration()

        return self.getDict()









