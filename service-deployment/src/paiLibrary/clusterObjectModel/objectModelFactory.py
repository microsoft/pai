
class objectModelFactory:



    def __init__(self, configurationPath):

        self.setConfiguration(configurationPath)
        self.objectModel = dict()



    def setConfiguration(self, configurationPath):

        clusterConfigurationPath = "{0}/cluster-configuration.yaml".format(configurationPath)
        k8sRoleDefinition = "{0}/k8s-role-definition.yaml".format(configurationPath)
        kubernetesConfiguration = "{0}/kubernetes-configuration.yaml".format(configurationPath)
        serviceConfiguration = "{0}/services-configuration.yaml".format(configurationPath)






