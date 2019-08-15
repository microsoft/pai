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
import json

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

    def validate_group_schema(self, groupitem):
        pattern = re.compile("^[A-Za-z0-9_]+$")
        if bool(pattern.match(groupitem['groupname'])) is False:
            return False, "group name should only contain alpha-numeric and underscore characters"
        if 'extension' in groupitem and 'acls' in groupitem['extension']:
            if 'virtualClusters' in groupitem['extension']['acls'] \
                    and not isinstance(groupitem['extension']['acls']['virtualClusters'], list):
                return False, "group.extension.acls.virtualClusters should be list"
            if 'admin' in groupitem['extension']['acls'] \
                    and not isinstance(groupitem['extension']['acls']['admin'], bool):
                return False, "group.extension.acls.admin should be bool"
        return True, None

    def defaulting_group_schema(self, groupitem, virtualClusters=[], admin=False):
        if 'extension' not in groupitem:
            groupitem['extension'] = {}
        if 'acls' not in groupitem['extension']:
            groupitem['extension']['acls'] = {}
        if 'virtualClusters' not in groupitem['extension']['acls']:
            groupitem['extension']['acls']['virtualClusters'] = virtualClusters
        if 'admin' not in groupitem['extension']['acls']:
            groupitem['extension']['acls']['admin'] = admin

    def validation_pre(self):
        validated, error_info = self.validate_group_schema(self.service_configuration['group-manager']['admin-group'])
        if not validated:
            return False, error_info
        validated, error_info = self.validate_group_schema(self.service_configuration['group-manager']['default-group'])
        if not validated:
            return False, error_info
        if 'grouplist' in self.service_configuration['group-manager']:
            for groupConfig in self.service_configuration['group-manager']['grouplist']:
                validated, error_info = self.validate_group_schema(groupConfig)
                if not validated:
                    return False, error_info
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
        self.defaulting_group_schema(self.service_configuration['group-manager']['admin-group'], admin=True)
        self.service_configuration['group-manager']['admin-group']['extension'] = json.dumps(
            self.service_configuration['group-manager']['admin-group']['extension'])
        self.defaulting_group_schema(self.service_configuration['group-manager']['default-group'], virtualClusters=['default'])
        self.service_configuration['group-manager']['default-group']['extension'] = json.dumps(
            self.service_configuration['group-manager']['default-group']['extension'])
        if 'grouplist' in self.service_configuration['group-manager']:
            for groupConfig in self.service_configuration['group-manager']['grouplist']:
                self.defaulting_group_schema(groupConfig)
                groupConfig['extension'] = json.dumps(groupConfig['extension'])
        return self.service_configuration

    def validation_post(self, cluster_object_model):
        if self.service_configuration["OIDC"] is False:
            return True, None
        if "uri" not in cluster_object_model["pylon"]:
            return False, "property named uri is missed in pylon configuration. Please check it."
        return True, None
