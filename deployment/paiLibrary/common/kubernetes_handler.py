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
        node_name = node_list[0].metadata.name

        """
        Example of address
         [
            {'address': '10.240.0.10', 'type': 'InternalIP'},
            {'address': '10.240.0.10', 'type': 'Hostname'}
         ]
        """
        node_addresses = list()
        for node_address_instance in node.status.addresses:
            node_addresses.append(
                {
                    "type": node_address_instance.type,
                    "address": node_address_instance.address
                }
            )

        resp[node_name] = node_addresses

    return node_list

