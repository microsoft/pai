import paiObjectModel
import yaml

class objectModelFactory:



    def __init__(self, configurationPath):


        self.clusterConfigurationPath = None
        self.k8sRoleDefinition = None
        self.kubernetesConfiguration = None
        self.serviceConfiguration = None

        self.configurationMap = dict()
        self.setConfiguration(configurationPath)
        self.initializeConifugration()


        self.objectModel = dict()



    def loadYamlConfig(configPath):

        with open(configPath, "r") as file:
            clusterData = yaml.load(file)

        return clusterData



    def setConfiguration(self, configurationPath):

        self.clusterConfigurationPath = "{0}/cluster-configuration.yaml".format(configurationPath)
        self.k8sRoleDefinition = "{0}/k8s-role-definition.yaml".format(configurationPath)
        self.kubernetesConfiguration = "{0}/kubernetes-configuration.yaml".format(configurationPath)
        self.serviceConfiguration = "{0}/services-configuration.yaml".format(configurationPath)



    def initializeConifugration(self):

        self.configurationMap["clusterConfiguration"] = self.loadYamlConfig(self.clusterConfigurationPath)
        self.configurationMap["k8sRoleDefinition"] = self.loadYamlConfig(self.k8sRoleDefinition)
        self.configurationMap["kubernetesConfiguration"] = self.loadYamlConfig(self.kubernetesConfiguration)
        self.configurationMap["serviceConfiguration"] = self.loadYamlConfig(self.serviceConfiguration)



    def objectModelPipeLine(self):

        ret = paiObjectModel(self.configurationMap)
        objectModel = ret.execute()
        return objectModel







