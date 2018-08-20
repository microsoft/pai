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
from . import linux_shell

import os

class BuildObjectModel:

    def __init__(self, configuration_dir):
        self.buildConfigDict = dict()
        self.buildConfiguration = os.path.join(configuration_dir,"services-configuration.yaml")

    def build_config_parse(self):

        # load config yaml file
        buildConfigContent = linux_shell.load_yaml_config(self.buildConfiguration)

        # section : clusterID

        self.buildConfigDict["clusterID"] = buildConfigContent["cluster"]["clusterid"]

        # section : clusterinfo:

        self.buildConfigDict["clusterinfo"] = buildConfigContent["cluster"]
        self.buildConfigDict["clusterinfo"]["dockerregistryinfo"] = buildConfigContent["clusterinfo"]["docker-registry-info"]
        self.buildConfigDict["clusterinfo"]["dockerregistryinfo"]["docker_namespace"] = \
            buildConfigContent["clusterinfo"]["docker-registry-info"]["docker-namespace"]
        self.buildConfigDict["clusterinfo"]["dockerregistryinfo"]["docker_registry_domain"] = \
            buildConfigContent["clusterinfo"]["docker-registry-info"]["docker-registry-domain"]
        if "docker-username" in self.buildConfigDict["clusterinfo"]["docker-registry-info"]:
            self.buildConfigDict["clusterinfo"]["dockerregistryinfo"]["docker_username"] = \
                buildConfigContent["clusterinfo"]["docker-registry-info"]["docker-username"]
        else:
            self.buildConfigDict["clusterinfo"]["dockerregistryinfo"]["docker_username"] = None
        if "docker-password" in buildConfigContent["clusterinfo"]["docker-registry-info"]:
            self.buildConfigDict["clusterinfo"]["dockerregistryinfo"]["docker_password"] = \
                buildConfigContent["clusterinfo"]["docker-registry-info"]["docker-password"]
        else:
            self.buildConfigDict["clusterinfo"]["dockerregistryinfo"]["docker_password"] = None
        self.buildConfigDict["clusterinfo"]["dockerregistryinfo"]["docker_tag"] = \
            buildConfigContent["clusterinfo"]["docker-registry-info"]["docker-tag"]
        self.buildConfigDict["clusterinfo"]["dockerregistryinfo"]["secretname"] = \
            buildConfigContent["clusterinfo"]["docker-registry-info"]["secret-name"]
