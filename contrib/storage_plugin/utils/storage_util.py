#!/usr/bin/env python
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

import os
import sys
import time
import logging
import logging.config
import base64

from kubernetes import client, config, watch
from kubernetes.client.rest import ApiException

logger = logging.getLogger(__name__)

def confirm_namespace(namespace):
    config.load_kube_config()
    api_instance = client.CoreV1Api()

    try:
        api_response = api_instance.read_namespace(namespace)

    except ApiException as e:
        if e.status == 404:
            logger.info("Couldn't find namespace {0}. Create new namespace".format(namespace))
            try:
                meta_data = client.V1ObjectMeta(name=namespace)
                body = client.V1ConfigMap(metadata=meta_data)
                api_response = api_instance.create_namespace(body)
                logger.info("Namesapce {0} is created".format(namespace))
            except ApiException as ie:
                logger.error("Exception when calling CoreV1Api->create_namespace: {0}".format(str(ie)))
                sys.exit(1)
        else:
            logger.error("Exception when calling CoreV1Api->read_namespace: {0}".format(str(e)))
            sys.exit(1)


# List usernames from pai-user secrets
def get_pai_users():
    users = []
    config.load_kube_config()
    api_instance = client.CoreV1Api()

    try:
        api_response = api_instance.list_namespaced_secret("pai-user")
        for item in api_response.items:
            users.append(base64.b64decode(item.data["username"]))

    except ApiException as e:
        if e.status == 404:
            logger.info("Couldn't find secret in namespace pai-user, exit")
            sys.exit(1)
        else:
            logger.error("Exception when calling CoreV1Api->list_namespaced_secret: {0}".format(str(e)))
            sys.exit(1)

    return users


def update_configmap(name, data_dict, namespace):
    confirm_namespace(namespace)

    config.load_kube_config()
    api_instance = client.CoreV1Api()

    meta_data = client.V1ObjectMeta()
    meta_data.namespace = namespace
    meta_data.name = name
    body = client.V1ConfigMap(
                metadata = meta_data,
                data = data_dict)

    try:
        api_response = api_instance.patch_namespaced_config_map(name, namespace, body)
        logger.info("configmap named {0} is updated.".format(name))
    except ApiException as e:
        if e.status == 404:
            try:
                logger.info("Couldn't find configmap named {0}. Create a new configmap".format(name))
                api_response = api_instance.create_namespaced_config_map(namespace, body)
                logger.info("Configmap named {0} is created".format(name))
            except ApiException as ie:
                logger.error("Exception when calling CoreV1Api->create_namespaced_config_map: {0}".format(str(ie)))
                sys.exit(1)
        else:
            logger.error("Exception when calling CoreV1Api->patch_namespaced_config_map: {0}".format(str(e)))
            sys.exit(1)


def get_storage_config(storage_config_name, namespace):
    confirm_namespace(namespace)

    config.load_kube_config()
    api_instance = client.CoreV1Api()

    try:
        api_response = api_instance.read_namespaced_config_map(storage_config_name, namespace)

    except ApiException as e:
        if e.status == 404:
            logger.info("Couldn't find configmap named {0}.".format(storage_config_name))
            return None
        else:
            logger.error("Exception when calling CoreV1Api->read_namespaced_config_map: {0}".format(str(e)))
            sys.exit(1)

    return api_response.data


def patch_secret(name, data_dict, namespace):
    confirm_namespace(namespace)

    config.load_kube_config()
    api_instance = client.CoreV1Api()

    meta_data = client.V1ObjectMeta()
    meta_data.namespace = namespace
    meta_data.name = name
    body = client.V1Secret(metadata = meta_data, data = data_dict)

    try:
        api_response = api_instance.patch_namespaced_secret(name, namespace, body)
        logger.info("Secret named {0} is updated.".format(name))
    except ApiException as e:
        logger.info(e)
        if e.status == 404:
            try:
                logger.info("Couldn't find secret named {0}. Create a new secret".format(name))
                api_response = api_instance.create_namespaced_secret(namespace, body)
                logger.info("Secret named {0} is created".format(name))
            except ApiException as ie:
                logger.error("Exception when calling CoreV1Api->create_namespaced_secret: {0}".format(str(ie)))
                sys.exit(1)
        else:
            logger.error("Exception when calling CoreV1Api->patch_namespaced_secret: {0}".format(str(e)))
            sys.exit(1)


def get_secret(name, namespace):
    confirm_namespace(namespace)

    config.load_kube_config()
    api_instance = client.CoreV1Api()

    try:
        api_response = api_instance.read_namespaced_secret(name, namespace)
    except ApiException as e:
        if e.status == 404:
            logger.info("Couldn't find secret named {0}.".format(name))
            return None
        else:
            logger.error("Exception when calling CoreV1Api->read_namespaced_config_map: {0}".format(str(e)))
            sys.exit(1)

    return api_response.data


def delete_secret_content(name, key, namespace):
    confirm_namespace(namespace)
    
    config.load_kube_config()
    api_instance = client.CoreV1Api()
    try:
        api_response = api_instance.read_namespaced_secret(name, namespace)
        if api_response is not None and type(api_response.data) is dict:
            removed_content = api_response.data.pop(key, None)
            if removed_content is not None:
                meta_data = client.V1ObjectMeta()
                meta_data.namespace = namespace
                meta_data.name = name
                body = client.V1Secret(metadata = meta_data, data = api_response.data)
                api_instance.replace_namespaced_secret(name, namespace, body)
    except ApiException as e:
        if e.status == 404:
            logger.info("Couldn't find secret named {0}.".format(name))
        else:
            logger.error("Exception when try to delete {0} from {1}: reason: {2}".format(key, name, str(e)))
            sys.exit(1)
