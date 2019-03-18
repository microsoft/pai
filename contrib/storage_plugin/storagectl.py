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
import subprocess
import multiprocessing
import random,string

from kubernetes import client, config, watch
from kubernetes.client.rest import ApiException

from utils.storage_util import *

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
            create_default_users("default.json")
        elif args.storage_type == "none":
            create_storage("default.json", args.storage_type, "default", "", "")
            create_default_users("default.json")


# Create default.json
def create_storage(name, type, title, address, root_path, shared_folders=None, private_folders=None):
    storage_dict = dict()
    storage_dict["type"] = type
    storage_dict["title"] = title
    storage_dict["address"] = address
    storage_dict["rootPath"] = root_path
    if len(shared_folders) > 0:
        storage_dict["sharedFolders"] = shared_folders

    if len(private_folders) > 0:
        storage_dict["privateFolders"] = private_folders

    conf_dict = dict()
    conf_dict[name] = json.dumps(storage_dict)
    update_configmap("storage-external", conf_dict, "default")

# Get user name from pai-user, create user data with default
def create_default_users(default_storage):
    conf_dict = dict()

    users = get_pai_users()
    storage_users = get_storage_config_files("storage-user")
    for user in users:
        user_file = "{0}.json".format(user)
        if user_file not in storage_users:
            user_dict = dict()
            user_dict["defaultStorage"] = default_storage
            user_dict["externalStorages"] = [default_storage]
            conf_dict[user_file] = json.dumps(user_dict)

    if len(conf_dict) > 0:
        update_configmap("storage-user", conf_dict, "default")


# Create path for storage
def create_path(storage_name, user_name = None):
    # Get storage info
    logger.info("Get external storage info from K8s")
    server_data = get_storage_config("storage-external", "default")
    if server_data == None or server_data.has_key(storage_name) == False:
        logger.error("Storage named {0} not exist! Exit".format(storage_name))
        sys.exit(1)

    server_json = json.loads(server_data[storage_name])
    address = server_json["address"]
    root_path = server_json["rootPath"]
    shared_folders = server_json["sharedFolders"]
    private_folders = server_json["privateFolders"]

    if len(shared_folders) + len(private_folders) == 0:
        logger.info("No folder set for {0}! Exit".format(storage_name))
        sys.exit(1)

    # Get all users that have access to storage
    users = []
    if (user != None):
        if len(private_folders) > 0:
            logger.info("Get all users related to this external storage")
            user_data = get_storage_config("storage-user", "default")
            for key, value in user_data.iteritems():
                user_json = json.loads(value)
                if storage_name in user_json["externalStorages"]:
                    users.append(os.path.splitext(key)[0])
    else:
        users.append(user_name)

    if (server_json["type"] == "nfs"):
        create_path_nfs(address, root_path, shared_folders, private_folders, users)
    else:
        logger.error("Unsupprt fs type: {0}".format(server_json["type"]))

def create_path_nfs(address, root_path, shared_folders, private_folders, users):
    # Mount storage locally and create folders
    logger.info("Creating folders on nfs server")

    os.system("apt-get -y install nfs-common")

    tmp_folder = "tmp{0}".format(''.join(random.sample(string.ascii_letters + string.digits, 6)))
    subprocess.Popen(["mkdir", tmp_folder], stdout=subprocess.PIPE)
    mount_cmd = "{0}:{1}".format(address, root_path).replace("//", "/")
    os.system("mount -t nfs4 {0} {1}".format(mount_cmd, tmp_folder))

    logger.info("mount -t nfs4 {0} {1}".format(mount_cmd, tmp_folder))

    for folder in shared_folders:
        # Create shared folders
        cf_cmd = "{0}/{1}".format(tmp_folder, folder).replace("//", "/")
        subprocess.Popen(["mkdir", "-p", cf_cmd], stdout=subprocess.PIPE)
    for base in private_folders:
        for user in users:
            cf_cmd = "{0}/{1}/{2}".format(tmp_folder, base, user).replace("//", "/")
            subprocess.Popen(["mkdir", "-p", cf_cmd], stdout=subprocess.PIPE)
            # Create user folders

    # Umount
    os.system("umount -l {0}".format(tmp_folder))
    subprocess.Popen(["rm", "-r", tmp_folder], stdout=subprocess.PIPE)
    logger.info("Finished creating folders on server")


def storage_set(args):
    if args.storage_type == "nfs":
        create_storage(args.name, args.storage_type, args.name, args.address, args.root_path, args.shared_folders, args.private_folders)
        if len(args.shared_folders) + len(args.private_folders) > 0:
            create_path(args.name)
    else:
        logger.error("Unknow storage type")

def storage_list(args):
    storage_data = get_storage_config("storage-external", "default")
    for key, value in storage_data.iteritems():
        print(key)
        print(value)

def storage_create_path(args):
    create_path(args.name)


def user_set_default(args):
    user_name = "{0}.json".format(args.user_name)
    storage_name = args.server_name

    conf_dict = dict()
    user_data = get_storage_config("storage-user", "default")
    if user_data != None and user_data.has_key(user_name):
        user_json = json.loads(user_data[user_name])
        user_json["defaultStorage"] = storage_name
        if storage_name not in user_json["externalStorages"]:
            user_json["externalStorages"].append(storage_name)
        conf_dict[user_name] = json.dumps(user_json)
    else:
        user_dict = dict()
        user_dict["defaultStorage"] = storage_name
        user_dict["externalStorages"] = [storage_name]
        conf_dict[user_name] = json.dumps(user_dict)
    update_configmap("storage-user", conf_dict, "default")
    create_path(storage_name, args.user_name)

# Push data to k8s configmap
def push_data(args):
    name = args.name
    schema = args.schema

    conf_dict = dict()
    real_path = os.path.abspath(os.path.expanduser(args.conf_path))

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
    nfs_parser.set_defaults(func=init_storage, storage_type="nfs")
    none_parser = init_subparsers.add_parser("none")
    none_parser.set_defaults(func=init_storage, storage_type="none")
   
    # ./storagectl.py server set|list|createpath 
    storage_parser = subparsers.add_parser("server", description="Commands to manage servers.", formatter_class=argparse.RawDescriptionHelpFormatter)
    storage_subparsers = storage_parser.add_subparsers(help="Add/modify, list or create path on servers")
    # storage set
    storage_set_parser = storage_subparsers.add_parser("set")
    storage_set_parser.add_argument("name")
    storage_set_subparsers = storage_set_parser.add_subparsers(help="Add/modify storage types, currently contains nfs")
    storage_set_nfs_parser = storage_set_subparsers.add_parser("nfs")
    storage_set_nfs_parser.add_argument("address", metavar="address", help="Nfs remote address")
    storage_set_nfs_parser.add_argument("root_path", metavar="rootpath", help="Nfs remote root path")
    storage_set_nfs_parser.add_argument("--sharedfolders", dest="shared_folders", nargs="+", help="Shared folders of external storage server")
    storage_set_nfs_parser.add_argument("--privatefolders", dest="private_folders", nargs="+", help="Base path of private folders of external storage server, the real path is [base]/[username]")
    storage_set_nfs_parser.set_defaults(func=storage_set, storage_type="nfs")
    # storage list
    storage_list_parser = storage_subparsers.add_parser("list")
    storage_list_parser.set_defaults(func=storage_list)
    # storage createpath   
    storage_createpath_parser = storage_subparsers.add_parser("createpath")
    storage_createpath_parser.add_argument("name", help="Storage name that need to create user folders")
    storage_createpath_parser.set_defaults(func=storage_create_path)

    # ./storagectl.py user set 
    user_parser = subparsers.add_parser("user", description="Control user", formatter_class=argparse.RawDescriptionHelpFormatter)
    user_subparsers = user_parser.add_subparsers(help="Manage user")
    user_set_default_storage_parser = user_subparsers.add_parser("setdefault")
    user_set_default_storage_parser.add_argument("user_name")
    user_set_default_storage_parser.add_argument("server_name")
    user_set_default_storage_parser.set_defaults(func=user_set_default)

    # ./storagectl.py push user|external path
    push_parser = subparsers.add_parser("push", description="Push storage config to k8s configmap.", formatter_class=argparse.RawDescriptionHelpFormatter)
    push_subparsers = push_parser.add_subparsers(help="Push user|server")
    push_server_parser = push_subparsers.add_parser("servre")
    push_server_parser.add_argument("conf_path", metavar="path", help="The path of directory or file which stores server config")
    push_server_parser.set_defaults(func=push_data, name="storage-external", schema="schemas/storage_server.schema.json")
    push_user_parser = push_subparsers.add_parser("user")
    push_user_parser.add_argument("conf_path", metavar="path", help="The path of directory or file which stores user config")
    push_user_parser.set_defaults(func=push_data, name="storage-user", schema="schemas/storage_user.schema.json")

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    setup_logger_config(logger)
    main()
