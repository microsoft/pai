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

import os
import sys
import time
import errno
import logging
import logging.config

from pprint import pprint

import kubernetes.client
from kubernetes.client.rest import ApiException
from kubernetes import client, config, watch


logger = logging.getLogger(__name__)



def get_subdirectory_list(path):

    return next(os.walk(path))[1]



def create_path(path):

    if not os.path.exists("{0}".format(path)):
        try:
            os.makedirs(path)

        except OSError as exc:
            if exc.errno == errno.EEXIST and os.path.isdir(path):
                logger.warning("Failed to create path {0}, due to that the path exists.".format(path))
            else:
                sys.exit(1)



def read_file_from_path(file_path):

    with open(file_path, "r") as fin:
        file_data = fin.read().decode('utf-8')

    return file_data



def write_generated_file(generated_file, file_path):

    with open(file_path, "w+") as fout:
        fout.write(generated_file)



def get_configmap(PAI_KUBE_CONFIG_DEFAULT_LOCATION, name, namespace = "default"):

    config.load_kube_config(config_file=PAI_KUBE_CONFIG_DEFAULT_LOCATION)
    api_instance = kubernetes.client.CoreV1Api()
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

    config.load_kube_config(config_file=PAI_KUBE_CONFIG_DEFAULT_LOCATION)
    api_instance = kubernetes.client.CoreV1Api()

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



def get_cluster_id(PAI_KUBE_CONFIG_DEFAULT_LOCATION):

    resp = get_configmap(PAI_KUBE_CONFIG_DEFAULT_LOCATION, "pai-cluster-id")
    if resp == None:
        return None

    # return a string
    return resp["data"]["cluster-id"]



def update_cluster_id(PAI_KUBE_CONFIG_DEFAULT_LOCATION, cluster_id):

    data_dict = dict()
    data_dict["cluster-id"] = cluster_id
    update_configmap(PAI_KUBE_CONFIG_DEFAULT_LOCATION, "pai-cluster-id", data_dict)



def get_conf_configmap(PAI_KUBE_CONFIG_DEFAULT_LOCATION):

    resp = get_configmap(PAI_KUBE_CONFIG_DEFAULT_LOCATION, "pai-configuration")
    if resp == None:
        return None

    # return a dict
    return resp["data"]



def update_conf_configmap(PAI_KUBE_CONFIG_DEFAULT_LOCATION, conf_data_dict):

    update_configmap(PAI_KUBE_CONFIG_DEFAULT_LOCATION, "pai-configuration", conf_data_dict)



