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


import logging
import logging.config
import kubernetes.client

from kubernetes.client.rest import ApiException
from kubernetes import client, config, watch


logger = logging.getLogger(__name__)


def list_all_nodes(PAI_KUBE_CONFIG_PATH, include_uninitialized = True):

    config.load_kube_config(config_file=PAI_KUBE_CONFIG_PATH)
    api_instance = kubernetes.client.CoreV1Api()

    try:
        api_response = api_instance.list_node(
            include_uninitialized = include_uninitialized
        )
        node_list = api_response.items
    except ApiException as e:
        logger.error("Exception when calling CoreV1Api->list_node: {0}".format(e))

    return node_list

