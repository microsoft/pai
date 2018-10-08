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


import sys
import logging
import logging.config
import kubernetes.client

from kubernetes.client.rest import ApiException
from kubernetes import client, config, watch


logger = logging.getLogger(__name__)



def get_kubernetes_corev1api(PAI_KUBE_CONFIG_PATH, **kwargs):

    config.load_kube_config(config_file=PAI_KUBE_CONFIG_PATH)
    api_instance = kubernetes.client.CoreV1Api()

    return api_instance



def list_all_nodes(PAI_KUBE_CONFIG_PATH, include_uninitialized = True):

    api_instance = get_kubernetes_corev1api(PAI_KUBE_CONFIG_PATH = PAI_KUBE_CONFIG_PATH)

    try:
        api_response = api_instance.list_node(
            include_uninitialized = include_uninitialized
        )
        node_list = api_response.items

    except ApiException as e:
        logger.error("Exception when calling kubernetes CoreV1Api->list_node: {0}".format(e))
        sys.exit(1)

    except Exception as e:
        logger.error("Error happend when calling kubernetes CoreV1Api->list_node: {0}".format(e))
        sys.exit(1)

    if len(node_list) == 0:
        return None

    resp = dict()
    for node in node_list:
        node_name = node.metadata.name

        """
         Example of address
         [
            {'address': '10.240.0.10', 'type': 'InternalIP'},
            {'address': '10.240.0.10', 'type': 'Hostname'},
            {'address': 'x.x.x.x', 'type': 'ExternalIP'}
         ]
         before using this list, please check whether it exists or not.
        """
        node_addresses = list()
        for node_address_instance in node.status.addresses:
            node_addresses.append(
                {
                    "type": node_address_instance.type,
                    "address": node_address_instance.address
                }
            )

        node_conditions = list()
        for node_conditions_instance in node.status.conditions:
            node_conditions.append(
                {
                    "type": node_conditions_instance.type,
                    # type str, value True, False, Unknown
                    "status": node_conditions_instance.status
                }
            )

        resp[node_name] = dict()
        resp[node_name]["address"] = node_addresses
        resp[node_name]["condition"] = node_conditions

    return resp



def get_configmap(PAI_KUBE_CONFIG_DEFAULT_LOCATION, name, namespace = "default"):

    api_instance = get_kubernetes_corev1api(PAI_KUBE_CONFIG_PATH=PAI_KUBE_CONFIG_DEFAULT_LOCATION)
    exact = True
    export = True

    target_configmap_data = None
    target_configmap_metadata = None

    try:
        api_response = api_instance.read_namespaced_config_map(name, namespace, exact=exact, export=export)
        target_configmap_data = api_response.data
        target_configmap_metadata = api_response.metadata

    except ApiException as e:
        if e.status == 404:
            logger.info("Couldn't find configmap named {0}".format(name))
            return None
        else:
            logger.error("Exception when calling CoreV1Api->read_namespaced_config_map: {0}".format(str(e)))
            sys.exit(1)

    ret = {
        "metadata" : target_configmap_metadata,
        "data"     : target_configmap_data
    }

    return ret



def update_configmap(PAI_KUBE_CONFIG_DEFAULT_LOCATION, name, data_dict, namespace = "default"):

    api_instance = get_kubernetes_corev1api(PAI_KUBE_CONFIG_PATH=PAI_KUBE_CONFIG_DEFAULT_LOCATION)

    meta_data = kubernetes.client.V1ObjectMeta()
    meta_data.namespace = namespace
    meta_data.name = name
    body = kubernetes.client.V1ConfigMap(
                            metadata = meta_data,
                            data = data_dict)

    try:
        api_response = api_instance.replace_namespaced_config_map(name, namespace, body)
        logger.info("configmap named {0} is updated.".format(name))

    except ApiException as e:

        if e.status == 404:

            try:
                logger.info("Couldn't find configmap named {0}. Create a new configmap".format(name))
                api_response = api_instance.create_namespaced_config_map(namespace, body)
                logger.info("Configmap named {0} is created".format(name))

            except ApiException as ie:
                logger.error("Exception when calling CoreV1Api->create_namespaced_config_map: {0}".format(str(e)))
                sys.exit(1)

        else:
            logger.error("Exception when calling CoreV1Api->replace_namespaced_config_map: {0}".format(str(e)))
            sys.exit(1)