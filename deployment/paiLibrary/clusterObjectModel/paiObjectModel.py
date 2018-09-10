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


class paiObjectModel:



    def __init__(self, configurationMap):

        self.rawData = configurationMap
        self.objectModel = dict()



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
            k8sDict["clusterinfo"]["etcd-data-path"] = "/var/etcd"

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
        port = "50070"
        ret = "http://{0}:{1}".format(vip, str(port))
        return ret



    def getHdfsUri(self):

        vip = self.getMasterIP()
        port = "9000"
        ret = "hdfs://{0}:{1}".format(vip, str(port))
        return ret




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



    def getDict(self):

        return self.objectModel



    def execute(self):

        self.validata()
        self.parseConfiguration()

        return self.getDict()









