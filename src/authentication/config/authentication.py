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

import re

class Authentication:

    def __init__(self, cluster_configuration, service_configuration, default_service_configuration):
        self.cluster_configuration = cluster_configuration
        self.service_configuration = default_service_configuration
        if "OIDC" in service_configuration:
            self.service_configuration["OIDC"] = service_configuration["OIDC"]
        if "OIDC-type" in service_configuration:
            self.service_configuration["OIDC-type"] = service_configuration["OIDC-type"]
        if "AAD" in service_configuration:
            self.service_configuration["AAD"] = service_configuration["AAD"]
        if "group-manager" in service_configuration:
            self.service_configuration["group-manager"] = service_configuration["group-manager"]

    def validation_pre(self):
        pattern = re.compile("^[A-Za-z0-9_]+$")
        if bool(pattern.match(self.service_configuration['group-manager']['admin-group']['groupname'])) is False:
            return False, "group name should only contain alpha-numeric and underscore characters"
        if bool(pattern.match(self.service_configuration['group-manager']['default-group']['groupname'])) is False:
            return False, "group name should only contain alpha-numeric and underscore characters"
        if 'grouplist' in self.service_configuration['group-manager']:
            for groupConfig in self.service_configuration['group-manager']['grouplist']:
                if bool(pattern.match(groupConfig['groupname'])) is False:
                    return False, "group name should only contain alpha-numeric and underscore characters"
        if self.service_configuration["OIDC"] is False:
            return True, None
        if "OIDC-type" not in self.service_configuration:
            return False, "OIDC-type is missing in service-configuration.yaml->authentication"
        if self.service_configuration["OIDC-type"] == "AAD":
            if "tenantID" not in self.service_configuration["AAD"]:
                return False, "tenantID is missing. If you wanna configure AAD-OIDC, you should configure service-configuration.yaml->authentication->AAD->tenantID"
            if "clientID" not in self.service_configuration["AAD"]:
                return False, "clientID is missing. If you wanna configure AAD-OIDC, you should configure service-configuration.yaml->authentication->AAD->clientID"
            if "clientSecret" not in self.service_configuration["AAD"]:
                return False, "ClientSecret is missing. If you wanna configure AAD-OIDC, you should configure service-configuration.yaml->authentication->AAD->ClientSecret"
        return True, None

    def run(self):
        return self.service_configuration

    def validation_post(self, cluster_object_model):
        if self.service_configuration["OIDC"] is False:
            return True, None
        if "uri" not in cluster_object_model["pylon"]:
            return False, "property named uri is missed in pylon configuration. Please check it."
        return True, None
