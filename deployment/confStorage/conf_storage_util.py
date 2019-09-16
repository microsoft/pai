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
import yaml

from pprint import pprint

import kubernetes.client
from kubernetes.client.rest import ApiException
from kubernetes import client, config, watch

from ..paiLibrary.common import kubernetes_handler


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


def load_yaml_config(config_path):

    with open(config_path, "r") as f:
        cluster_data = yaml.load(f, yaml.SafeLoader)

    return cluster_data


def write_generated_file(generated_file, file_path):

    with open(file_path, "w+") as fout:
        fout.write(generated_file.encode('utf-8'))


def get_cluster_id(PAI_KUBE_CONFIG_DEFAULT_LOCATION):

    resp = kubernetes_handler.get_configmap(PAI_KUBE_CONFIG_DEFAULT_LOCATION, "pai-cluster-id")
    if resp is None:
        return None

    # return a string
    return resp["data"]["cluster-id"]


def update_cluster_id(PAI_KUBE_CONFIG_DEFAULT_LOCATION, cluster_id):

    data_dict = dict()
    data_dict["cluster-id"] = cluster_id
    kubernetes_handler.update_configmap(PAI_KUBE_CONFIG_DEFAULT_LOCATION, "pai-cluster-id", data_dict)


def get_conf_configmap(PAI_KUBE_CONFIG_DEFAULT_LOCATION):

    resp = kubernetes_handler.get_configmap(PAI_KUBE_CONFIG_DEFAULT_LOCATION, "pai-configuration")
    if resp is None:
        return None

    # return a dict
    return resp["data"]


def update_conf_configmap(PAI_KUBE_CONFIG_DEFAULT_LOCATION, conf_data_dict):

    kubernetes_handler.update_configmap(PAI_KUBE_CONFIG_DEFAULT_LOCATION, "pai-configuration", conf_data_dict)
