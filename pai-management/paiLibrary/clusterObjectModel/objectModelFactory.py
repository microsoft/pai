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



    def loadYamlConfig(self, configPath):

        with open(configPath, "r") as f:
            clusterData = yaml.load(f)

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

        ret = paiObjectModel.paiObjectModel(self.configurationMap)
        objectModel = ret.execute()
        return objectModel







