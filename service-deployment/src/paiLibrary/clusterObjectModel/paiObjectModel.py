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

        # section : component_list

        k8sDict["component_list"] = self.rawData["k8sRoleDefinition"]["component-list"]

        # section : remote_deployment

        k8sDict["remote_deployment"] = self.rawData["k8sRoleDefinition"]["k8s-role"]

        # section : mastermachinelist & workermachinelist & proxymachinelist

        masterDict = dict()
        workerDict = dict()
        proxyDict = dict()

        for host in self.rawData["clusterConfiguration"]["machine-list"]:
            if "dashboard" in host:
                k8sDict["clusterinfo"][" dashboard-host"] = host["hostip"]

            if host["k8s-role"] == "master":

                masterDict[host["hostname"]] = host
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

            k8sDict["mastermachinelist"] = masterDict
            k8sDict["workermachinelist"] = workerDict
            k8sDict["proxymachinelist"] = proxyDict

            return k8sDict



    def labelExpend(self, host):

        if "pai-master" in host and host["pai-master"] == "true":

            host["hdfsrole"] = "master"
            host["yarnrole"] = "master"
            host["zookeeper"] = "true"
            host["jobhistory"] = "true"
            host["launcher"] = "true"
            host["restserver"] = "true"
            host["webportal"] = "true"
            host["prometheus"] = "true"
            host["grafana"] = "true"
            host["pylon"] = "true"
            host["node-exporter"] = "true"

        if "pai-worker" in host and host["pai-worker"] == "true":

            host["hdfsrole"] = "worker"
            host["yarnrole"] = "worker"
            host["node-exporter"] = "true"



    def serviceParse(self):

        serviceDict = dict()

        # section : clusterID

        serviceDict["clusterID"] = self.rawData["serviceConfiguration"]["cluster"]["clusterid"]

        # section : clusterinfo:

        serviceDict["clusterinfo"] = self.rawData["serviceConfiguration"]["cluster"]
        serviceDict["clusterinfo"]["datapath"] = serviceDict["clusterinfo"]["data-path"]
        serviceDict["clusterinfo"]["nvidia_drivers_version"] = serviceDict["clusterinfo"]["nvidia-drivers-version"]
        serviceDict["clusterinfo"]["dockerverison"] = serviceDict["clusterinfo"]["docker-verison"]
        serviceDict["clusterinfo"]["dockerregistryinfo"] = serviceDict["clusterinfo"]["docker-registry-info"]
        serviceDict["clusterinfo"]["dockerregistryinfo"]["docker_namespace"] = \
            serviceDict["clusterinfo"]["docker-registry-info"]["docker-namespace"]
        serviceDict["clusterinfo"]["dockerregistryinfo"]["docker_registry_domain"] = \
            serviceDict["clusterinfo"]["docker-registry-info"]["docker-registry-domain"]
        serviceDict["clusterinfo"]["dockerregistryinfo"]["docker_username"] = \
            serviceDict["clusterinfo"]["docker-registry-info"]["docker-username"]
        serviceDict["clusterinfo"]["dockerregistryinfo"]["docker_password"] = \
            serviceDict["clusterinfo"]["docker-registry-info"]["docker-password"]
        serviceDict["clusterinfo"]["dockerregistryinfo"]["docker_tag"] = \
            serviceDict["clusterinfo"]["docker-registry-info"]["docker-tag"]
        serviceDict["clusterinfo"]["dockerregistryinfo"]["secretname"] = \
            serviceDict["clusterinfo"]["docker-registry-info"]["secret-name"]

        # section : hadoop

        serviceDict["clusterinfo"]["hadoopinfo"] = \
            self.rawData["serviceConfiguration"]["hadoop"]
        serviceDict["clusterinfo"]["hadoopinfo"]["custom_hadoop_binary_path"] = \
            serviceDict["clusterinfo"]["hadoopinfo"]["custom-hadoop-binary-path"]
        serviceDict["clusterinfo"]["hadoopinfo"]["hadoopversion"] = \
            serviceDict["clusterinfo"]["hadoopinfo"]["hadoop-version"]
        serviceDict["clusterinfo"]["hadoopinfo"]["configmapname"] = "hadoop-configuration"
        serviceDict["clusterinfo"]["hadoopinfo"]["hadoop_vip"] = \
            serviceDict["clusterinfo"]["hadoopinfo"]["hadoop-version"] = self.getMasterIP()

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
        serviceDict["clusterinfo"]["restserverinfo"]["webservice_uri"]





    def getMasterIP(self):

        for host in self.rawData["clusterConfiguration"]["machine-list"]:
            if "pai-master" in host and host["pai-master"] == "true":
                return host["pai-master"]["hostip"]

        print "At least one and only one machine should be labeled with pai-master = true"
        print "please modify your cluster configuration, thanks."

        sys.exit(1)



    def parseConfiguration(self):

        self.objectModel["k8s"] = self.k8sParse()
        self.objectModel["service"] = self.serviceParse()









