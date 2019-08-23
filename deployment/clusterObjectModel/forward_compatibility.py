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

import json

def transform(old_model, old_key, new_model, new_key):
    old_key_list = old_key.split('.')
    new_key_list = new_key.split('.')
    old_dict = old_model
    new_dict = new_model
    if old_dict == None:
        return
    for key in old_key_list:
        if key not in old_dict:
            return
        old_dict = old_dict[key]
    for key in new_key_list[:-1]:
        if key not in new_dict:
            new_dict[key] = {}
        new_dict = new_dict[key]
    new_dict[new_key_list[-1]] = old_dict

def service_configuration_convert(service_configuration):

    if "hadoop" not in service_configuration and "rest-server" in service_configuration:
        return service_configuration_add_cluster_type(service_configuration)

    new_configuration = {}

    transform(service_configuration, "drivers", new_configuration, "drivers")
    transform(service_configuration, "webportal", new_configuration, "webportal")
    transform(service_configuration, "pylon", new_configuration, "pylon")

    transform(service_configuration, "cluster.cluster-id", new_configuration, "cluster.common.cluster-id")
    transform(service_configuration, "cluster.data-path", new_configuration, "cluster.common.data-path")
    transform(service_configuration, "cluster.docker-registry-info.docker-namespace",
              new_configuration, "cluster.docker-registry.namespace")
    transform(service_configuration, "cluster.docker-registry-info.docker-registry-domain",
              new_configuration, "cluster.docker-registry.domain")
    transform(service_configuration, "cluster.docker-registry-info.docker-username",
              new_configuration, "cluster.docker-registry.username")
    transform(service_configuration, "cluster.docker-registry-info.docker-password",
              new_configuration, "cluster.docker-registry.password")
    transform(service_configuration, "cluster.docker-registry-info.docker-tag",
              new_configuration, "cluster.docker-registry.tag")
    transform(service_configuration, "cluster.docker-registry-info.secret-name",
              new_configuration, "cluster.docker-registry.secret-name")

    transform(service_configuration, "restserver", new_configuration, "rest-server")
    transform(service_configuration, "frameworklauncher", new_configuration, "yarn-frameworklauncher")

    transform(service_configuration, "hadoop.virtualClusters",
              new_configuration, "hadoop-resource-manager.virtualClusters")
    transform(service_configuration, "prometheus.yarn_exporter_port",
              new_configuration, "hadoop-resource-manager.yarn_exporter_port")

    transform(service_configuration, "prometheus.prometheus-port",
              new_configuration, "prometheus.port")
    transform(service_configuration, "prometheus.scrape_interval",
              new_configuration, "prometheus.scrape_interval")

    transform(service_configuration, "prometheus.alerting.alert_receiver",
              new_configuration, "alert-manager.receiver")
    transform(service_configuration, "prometheus.alerting.alert_manager_port",
              new_configuration, "alert-manager.port")
    transform(service_configuration, "prometheus.alerting.smtp_url",
              new_configuration, "alert-manager.smtp_url")
    transform(service_configuration, "prometheus.alerting.smtp_from",
              new_configuration, "alert-manager.smtp_from")
    transform(service_configuration, "prometheus.alerting.smtp_auth_username",
              new_configuration, "alert-manager.smtp_auth_username")
    transform(service_configuration, "prometheus.alerting.smtp_auth_password",
              new_configuration, "alert-manager.smtp_auth_password")

    transform(service_configuration, "grafana.grafana-port",
              new_configuration, "grafana.port")

    transform(service_configuration, "prometheus.node-exporter-port",
              new_configuration, "node-exporter.port")

    return service_configuration_add_cluster_type(new_configuration, True)


def service_configuration_add_cluster_type(service_configuration, converted = False):
    if "cluster" not in service_configuration:
        service_configuration["cluster"] = {"common": {"cluster-type": "yarn"}}
        return service_configuration, True
    else:
        if "common" not in service_configuration["cluster"]:
            service_configuration["cluster"]["common"] = {"cluster-type": "yarn"}
            return service_configuration, True
        else:
            if "cluster-type" not in service_configuration["cluster"]["common"]:
                service_configuration["cluster"]["common"]["cluster-type"] = "yarn"
                return service_configuration, True
            else:
                return service_configuration, converted
