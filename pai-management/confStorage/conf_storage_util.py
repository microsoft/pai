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
import logging
import logging.config

import kubernetes.client
from kubernetes.client.rest import ApiException
from kubernetes import client, config, watch


logger = logging.getLogger(__name__)
PAI_KUBE_CONFIG_DEFAULT_LOCATION = ""


def get_configmap(PAI_KUBE_CONFIG_DEFAULT_LOCATION, name, namespace = "default"):

    config.load_kube_config(config_file=PAI_KUBE_CONFIG_DEFAULT_LOCATION)
    api_instance = kubernetes.client.CoreV1Api()
    namespace = "default"
    pretty = 'true'
    exact = True
    export = True

    target_configmap_data = None
    target_configmap_metadata = None

    try:
        api_response = api_instance.read_namespaced_config_map(name, namespace, pretty=pretty, exact=exact, export=export)
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



def update_configmap(PAI_KUBE_CONFIG_DEFAULT_LOCATION, name, data, namespace = "default"):


    config.load_kube_config(config_file=PAI_KUBE_CONFIG_DEFAULT_LOCATION)
    api_instance = kubernetes.client.CoreV1Api()








def get_cluster_id(PAI_KUBE_CONFIG_DEFAULT_LOCATION):

    resp = get_configmap(PAI_KUBE_CONFIG_DEFAULT_LOCATION, "pai-cluster-id")
    if resp == None:
        return None

    # return a string
    return resp["data"]["cluster-id"]



def update_cluster_id():
    None



def get_conf_configmap():

    resp = get_configmap(PAI_KUBE_CONFIG_DEFAULT_LOCATION, "pai-configuration")
    if resp == None:
        return None

    # return a dict
    return resp["data"]



def update_conf_configmap():
    None




if __name__ == "__main__":

    #global PAI_KUBE_CONFIG_DEFAULT_LOCATION
    PAI_KUBE_CONFIG_DEFAULT_LOCATION = os.path.expanduser("~/.kube/config")
    if os.environ.get('KUBECONFIG', None) != None:
        PAI_KUBE_CONFIG_DEFAULT_LOCATION = os.environ.get('KUBECONFIG', None)

    configmap_dict = get_configmap(PAI_KUBE_CONFIG_DEFAULT_LOCATION, "hadoop-configuration")

    if configmap_dict == None:
        print("No Configmap Found!")
    else:
        #print(configmap_dict['data'])
        for key in configmap_dict['data']:
            print(key)


