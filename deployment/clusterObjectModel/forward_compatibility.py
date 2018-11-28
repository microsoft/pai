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



def service_configuration_convert(service_configuration):
    if "rest-server" not in service_configuration and "restserver" in service_configuration:
        service_configuration["rest-server"] = service_configuration["restserver"]

    if "yarn-frameworklauncher" not in service_configuration and "frameworklauncher" in service_configuration:
        service_configuration["yarn-frameworklauncher"] = service_configuration["frameworklauncher"]


    if "cluster" in service_configuration:
        if "common" not in service_configuration["cluster"]:
            if "clusterid" in service_configuration["cluster"]:
                service_configuration["cluster"]["common"]["clusterid"] = service_configuration["cluster"]["clusterid"]
            if "data-path" in service_configuration["cluster"]:
                service_configuration["cluster"]["common"]["data-path"] = service_configuration["cluster"]["data-path"]
        if "docker-registry" not in service_configuration["cluster"] and "docker-registry-info" in service_configuration["cluster"]:
            if "docker-namespace" in service_configuration["cluster"]["docker-registry-info"]:
                service_configuration["cluster"]["docker-registry"]["namespace"] = \
                service_configuration["cluster"]["docker-registry-info"]["docker-namespace"]
            if "docker-registry-domain" in service_configuration["cluster"]["docker-registry-info"]:
                service_configuration["cluster"]["docker-registry"]["domain"] = \
                service_configuration["cluster"]["docker-registry-info"]["docker-registry-domain"]
            if "docker-username" in service_configuration["cluster"]["docker-registry-info"]:
                service_configuration["cluster"]["docker-registry"]["username"] = \
                service_configuration["cluster"]["docker-registry-info"]["docker-username"]
            if "docker-password" in service_configuration["cluster"]["docker-registry-info"]:
                service_configuration["cluster"]["docker-registry"]["password"] = \
                service_configuration["cluster"]["docker-registry-info"]["docker-password"]
            if "docker-tag" in service_configuration["cluster"]["docker-registry-info"]:
                service_configuration["cluster"]["docker-registry"]["tag"] = \
                service_configuration["cluster"]["docker-registry-info"]["docker-tag"]
            if "secret-name" in service_configuration["cluster"]["docker-registry-info"]:
                service_configuration["cluster"]["docker-registry"]["secret-name"] = \
                service_configuration["cluster"]["docker-registry-info"]["secret-name"]


    if "hadoop" in service_configuration:
        if "hadoop-resource-manager" not in service_configuration or "virtualClusters" not in service_configuration["hadoop-resource-manager"] :
            service_configuration["hadoop-resource-manager"]["virtualClusters"] = service_configuration["hadoop"]["virtualClusters"]

    return service_configuration


