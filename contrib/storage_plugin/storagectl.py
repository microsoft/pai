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

from __future__ import absolute_import
from __future__ import print_function

import os
import sys
import argparse
import datetime
import logging
import logging.config
import json

from kubernetes import client, config, watch
from kubernetes.client.rest import ApiException

try:
    import jsonschema
except:
    os.system("pip install jsonschema")
    import jsonschema


logger = logging.getLogger(__name__)

def push_user(args):
    push_data("storage-user", args.conf_path, "schemas/storage_user.schema.json")

def push_external(args):
    push_data("storage-external", args.conf_path, "schemas/storage_external.schema.json")

def push_data(name, raw_path, schema):
    conf_dict = dict()
    real_path = os.path.abspath(os.path.expanduser(raw_path))

    with open(os.path.abspath(schema), "r") as jsonFile:
        schema_json = json.load(jsonFile)

    if os.path.isdir(real_path):
        files = os.listdir(real_path)
        for file_name in files:
            file_path = os.path.join(real_path, file_name)
            if (os.path.isfile(file_path)):
                with open(file_path, "r") as jsonFile:
                    file_json = json.load(jsonFile)
                if validate_json(file_json, schema_json) == True:
                    conf_dict[file_name] = read_file_from_path(file_path)
                else:
                    logger.warning("File {0} is not the right format, skipped.".format(file_name))
    elif os.path.isfile(real_path):
        file_name = os.path.basename(real_path)
        with open(real_path, "r") as jsonFile:
            file_json = json.load(jsonFile)
        if validate_json(file_json, schema_json) == True:
            conf_dict[file_name] = read_file_from_path(real_path)
        else:
            logger.warning("File {0} is not the right format, skipped.".format(file_name))
    else:
        logger.error("Not file or directory")
        sys.exit(1)
 
    update_configmap(name, conf_dict, "default")


def read_file_from_path(file_path):
    with open(file_path, "r") as fin:
        file_data = fin.read().decode('utf-8')
    return file_data

def validate_json(file_json, schema_json):
    try:
        jsonschema.validate(file_json, schema_json)
        return True
    except jsonschema.ValidationError as e:
        return False

def update_configmap(name, data_dict, namespace):
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
                logger.error("Exception when calling CoreV1Api->create_namespaced_config_map: {0}".format(str(e)))
                sys.exit(1)
        else:
            logger.error("Exception when calling CoreV1Api->replace_namespaced_config_map: {0}".format(str(e)))
            sys.exit(1)

def setup_logger_config(logger):
    """
    Setup logging configuration.
    """
    if len(logger.handlers) == 0:
        logger.propagate = False
        logger.setLevel(logging.DEBUG)
        consoleHandler = logging.StreamHandler()
        consoleHandler.setLevel(logging.DEBUG)
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        consoleHandler.setFormatter(formatter)
        logger.addHandler(consoleHandler)


def main():
    scriptFolder=os.path.dirname(os.path.realpath(__file__))

    parser = argparse.ArgumentParser(description="pai storage management tool")
    subparsers = parser.add_subparsers(help='Storage management cli')

    # ./storagectl.py pushexternal ...
    push_external_parser = subparsers.add_parser("pushexternal", description="Push external storage config to k8s configmap.", formatter_class=argparse.RawDescriptionHelpFormatter)
    push_external_parser.add_argument("-p", "--path", dest="conf_path", required=True, help="the path of directory or file which stores external storage config")
    push_external_parser.set_defaults(func = push_external)

    # ./storagectl.py pushuser ...
    push_user_parser = subparsers.add_parser("pushuser", description="Push user config to k8s configmap.", formatter_class=argparse.RawDescriptionHelpFormatter)
    push_user_parser.add_argument("-p", "--path", dest="conf_path", required=True, help="the path of directory or file which stores user storage config")
    push_user_parser.set_defaults(func = push_user)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    setup_logger_config(logger)
    main()
