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
import base64

from kubernetes import client, config, watch
from kubernetes.client.rest import ApiException

try:
    import jsonschema
except:
    os.system("pip install jsonschema")
    import jsonschema


logger = logging.getLogger(__name__)

def init_storage(args):
    storage_externals = get_storage_config_files("storage-external")
    if args.force == False and len(storage_externals) > 0:
        logger.error("Storage config already initialized, exit...")
        sys.exit(1)        
    else:
        if args.storage_type == "nfs":
            create_storage("default.json", args.storage_type, "default", args.address, args.root_path)
        elif args.storage_type == "none":
            create_storage("default.json", args.storage_type, "default", "", "")

# Create default.json
def create_storage(name, type, title, address, root_path):
    storage_dict = dict()
    storage_dict["type"] = type
    storage_dict["title"] = title
    storage_dict["address"] = address
    storage_dict["rootPath"] = root_path

    conf_dict = dict()
    conf_dict[name] = json.dumps(storage_dict)
    update_configmap("storage-external", conf_dict, "default")
    create_default_users(name)

# Get user name from pai-user, create user data with default
def create_default_users(default_file):
    conf_dict = dict()

    users = get_pai_users()
    storage_users = get_storage_config_files("storage-user")
    for user in users:
        user_file = "{0}.json".format(user)
        if user_file not in storage_users:
            user_dict = dict()
            user_dict["defaultStorage"] = default_file
            user_dict["externalStorages"] = [default_file]
            conf_dict[user_file] = json.dumps(user_dict)

    if len(conf_dict) > 0:
        update_configmap("storage-user", conf_dict, "default")


def get_pai_users():
    # List usernames from pai-user secrets
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

def get_storage_config_files(storage_config_name):
    # List storage users
    users = []
    config.load_kube_config()
    api_instance = client.CoreV1Api()

    try:
        api_response = api_instance.read_namespaced_config_map(storage_config_name, "default")
        for item in api_response.data.keys():
            users.append(item)

    except ApiException as e:
        if e.status == 404:
            logger.info("No storage user info was created.")
        else:
            logger.error("Exception when calling CoreV1Api->read_namespaced_config_map: {0}".format(str(e)))
            sys.exit(1)

    return users


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
            logger.error("Exception when calling CoreV1Api->patch_namespaced_config_map: {0}".format(str(e)))
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
    os.chdir(scriptFolder)

    parser = argparse.ArgumentParser(description="pai storage management tool")
    subparsers = parser.add_subparsers(help='Storage management cli')

    # ./storagectl.py init ... 
    init_parser = subparsers.add_parser("init", description="Init storage config with default external storage server.", formatter_class=argparse.RawDescriptionHelpFormatter)
    init_parser.add_argument("-f", "--force", dest="force", default=False, action="store_true", help="Force init default.json with settings")
    init_subparsers = init_parser.add_subparsers(help="Init with external storage")
    nfs_parser = init_subparsers.add_parser("nfs")
    nfs_parser.add_argument("address", metavar="address", help="Nfs remote address")
    nfs_parser.add_argument("root_path", metavar="rootpath", help="Nfs remote root path")
    nfs_parser.set_defaults(func = init_storage, storage_type = "nfs")
    none_parser = init_subparsers.add_parser("none")
    none_parser.set_defaults(func = init_storage, storage_type = "none")
   
    # ./storagectl.py pushexternal ...
    push_external_parser = subparsers.add_parser("pushexternal", description="Push external storage config to k8s configmap.", formatter_class=argparse.RawDescriptionHelpFormatter)
    push_external_parser.add_argument("conf_path", metavar="path", help="The path of directory or file which stores external storage config")
    push_external_parser.set_defaults(func = push_external)

    # ./storagectl.py pushuser ...
    push_user_parser = subparsers.add_parser("pushuser", description="Push user config to k8s configmap.", formatter_class=argparse.RawDescriptionHelpFormatter)
    push_user_parser.add_argument("conf_path", metavar="path", help="The path of directory or file which stores user storage config")
    push_user_parser.set_defaults(func = push_user)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    setup_logger_config(logger)
    main()
