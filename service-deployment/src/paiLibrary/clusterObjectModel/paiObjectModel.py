

class paiObjectModel:



    def __init__(self, configurationMap):

        self.rawData = configurationMap
        self.objectModel = dict()



    def validata(self):

        pass



    def k8sParse(self):

        k8sDict = dict()

        # chapter : clusterID

        k8sDict["clusterID"] = self.rawData["serviceConfiguration"]["clusterid"]

        # chapter : clusterinfo

        k8sDict["clusterinfo"] = self.rawData["kubernetesConfiguration"]["kubernetes"]
        k8sDict["clusterinfo"]["api-servers-ip"] = k8sDict["clusterinfo"]["load-balance-ip"]
        k8sDict["clusterinfo"]["dockerregistry"] = k8sDict["clusterinfo"]["docker-registry"]
        k8sDict["clusterinfo"]["hyperkubeversion"] = k8sDict["clusterinfo"]["hyperkube-version"]
        k8sDict["clusterinfo"]["etcdversion"] = k8sDict["clusterinfo"]["etcd-version"]
        k8sDict["clusterinfo"]["apiserverversion"] = k8sDict["clusterinfo"]["apiserver-version"]
        k8sDict["clusterinfo"]["kubeschedulerversion"] = k8sDict["clusterinfo"]["kube-scheduler-version"]
        k8sDict["clusterinfo"]["kubecontrollermanagerversion"] = k8sDict["clusterinfo"]["kube-controller-manager-version"]
        k8sDict["clusterinfo"]["dashboard_version"] = k8sDict["clusterinfo"]["dashboard-version"]

        # chapter : component_list

        k8sDict["component_list"] = self.rawData["k8sRoleDefinition"]["component-list"]

        # chapter : remote_deployment

        k8sDict["remote_deployment"] = self.rawData["k8sRoleDefinition"]["k8s-role"]

        # chapter : mastermachinelist & workermachinelist & proxymachinelist

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



    def parseConfiguration(self):

        self.objectModel["k8s"] = self.k8sParse()
        self.objectModel["service"] = self.









