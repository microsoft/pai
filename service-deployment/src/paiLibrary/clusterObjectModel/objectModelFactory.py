import paiObjectModel

class objectModelFactory:



    def __init__(self, configurationPath):


        self.clusterConfigurationPath = None
        self.k8sRoleDefinition = None
        self.kubernetesConfiguration = None
        self.serviceConfiguration = None

        self.setConfiguration(configurationPath)
        self.objectModel = dict()



    def setConfiguration(self, configurationPath):

        self.clusterConfigurationPath = "{0}/cluster-configuration.yaml".format(configurationPath)
        self.k8sRoleDefinition = "{0}/k8s-role-definition.yaml".format(configurationPath)
        self.kubernetesConfiguration = "{0}/kubernetes-configuration.yaml".format(configurationPath)
        self.serviceConfiguration = "{0}/services-configuration.yaml".format(configurationPath)



    def objectModelPipeLine(self):





