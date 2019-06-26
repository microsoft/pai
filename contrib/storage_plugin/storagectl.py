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

logger = logging.getLogger(__name__)

def group_set(args):
    secret_name = "".join("{:02x}".format(ord(c)) for c in args.name)
    secret_dict = dict()
    secret_dict["groupname"] = base64.b64encode(args.name)
    secret_dict["externalName"] = base64.b64encode(args.external_name)
    secret_dict["extension"] = base64.b64encode("{\"groupType\":\"storge\"}")
    secret_dict["description"] = base64.b64encode(args.description)
    patch_secret(secret_name, secret_dict, "pai-group")

def group_list(args):
    secrets = get_namespaced_secrets_data("pai-group")
    for secret in secrets:
        for key, value in secret.iteritems():
            secret[key] = base64.b64decode(value)
    print("\n".join(str(secret) for secret in secrets))

def group_delete(args):
    secret_name = "".join("{:02x}".format(ord(c)) for c in args.name)
    delete_secret(secret_name, "pai-group")


# Save server config to k8s secret
def save_secret(namespace, secret_name, name, content_dict):
    secret_dict = dict()
    secret_dict[name] = base64.b64encode(json.dumps(content_dict))
    patch_secret(secret_name, secret_dict, namespace)


def show_secret(args):
    secret_data = get_secret(args.secret_name, args.namespace)
    if secret_data is None:
        logger.info("No secret found.")
    else:
        for key, value in secret_data.iteritems():
            if args.name is None or key in args.name:
                print(key)
                print(base64.b64decode(value))

def delete_secret(args):
    delete_secret_content(args.secret_name, args.name, args.namespace)

def server_set(args):
    content_dict = dict()
    content_dict["spn"] = args.name
    content_dict["type"] = args.server_type
    if args.server_type == "nfs":
        content_dict["address"] = args.address
        content_dict["rootPath"] = args.root_path
    elif args.server_type == "samba":
        content_dict["address"] = args.address
        content_dict["rootPath"] = args.root_path
        content_dict["userName"] = args.user_name
        content_dict["password"] = args.password
        content_dict["domain"] = args.domain
    elif args.server_type == "azurefile":
        content_dict["dataStore"] = args.data_store
        content_dict["fileShare"] = args.file_share
        content_dict["accountName"] = args.account_name
        content_dict["key"] = args.key
        if args.proxy is not None:
            content_dict["proxy"] = args.proxy
    elif args.server_type == "azureblob":
        content_dict["dataStore"] = args.data_store
        content_dict["containerName"] = args.container_name
        content_dict["accountName"] = args.account_name
        content_dict["key"] = args.key
    elif args.server_type == "hdfs":
        content_dict["namenode"] = args.namenode
        content_dict["port"] = args.port
    else:
        logger.error("Unknow storage type")
        sys.exit(1)
    save_secret("pai-storage", "storage-server", args.name, content_dict)


def config_set(args):
    try:
        content_dict = dict()
        content_dict["name"] = args.name
        content_dict["gpn"] = args.gpn
        content_dict["servers"] = args.servers
        content_dict["default"] = args.default
        if args.mount_info is not None:
            mount_infos = []
            for info_data in args.mount_info:
                # Verify mount point, mountPoint should starts with "/" and path should not
                if not info_data[0].startswith("/"):
                    raise NameError("MOUNT_POINT should be absolute path and starts with \'/\'")
                elif info_data[2].startswith("/"):
                    raise NameError("PATH should be relative path and not starts with \'/\'")
                else:
                    info = {"mountPoint" : info_data[0], "server" : info_data[1], "path" : info_data[2]}
                    mount_infos.append(info)
            content_dict["mountInfos"] = mount_infos
    except NameError as e:
        logger.error(e)
    else:
        save_secret("pai-storage", "storage-config", args.name, content_dict)


def user_set(args):
    content_dict = dict()
    content_dict["upn"] = args.name
    content_dict["servers"] = args.servers
    save_secret("pai-storage", "storage-user", args.name, content_dict)


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

    # ./storagectl.py group ...
    group_parser = subparsers.add_parser("group", description="Manage group", formatter_class=argparse.RawDescriptionHelpFormatter)
    group_subparsers = group_parser.add_subparsers(help="Manage group")
    # ./storagectl.py group set GROUP_NAME EXTERNAL_GROUP_NAME [-d DESCRIPTION]
    group_set_parser = group_subparsers.add_parser("set")
    group_set_parser.add_argument("name", help="Group name")
    group_set_parser.add_argument("external_name", help="External group name")
    group_set_parser.add_argument("-d", "--desc", dest="description", default="", help="Description")
    group_set_parser.set_defaults(func=group_set)
    # ./storagectl.py group list
    group_list_parser = group_subparsers.add_parser("list")
    group_list_parser.set_defaults(func=group_list)
    # ./storagectl.py group delete GROUP_NAME
    group_del_parser = group_subparsers.add_parser("delete")
    group_del_parser.add_argument("name")
    group_del_parser.set_defaults(func=group_delete)


    # ./storagectl.py server set|list|delete 
    server_parser = subparsers.add_parser("server", description="Commands to manage servers.", formatter_class=argparse.RawDescriptionHelpFormatter)
    server_subparsers = server_parser.add_subparsers(help="Add/modify, list or delete server")
    # ./storgectl.py server set ...
    server_set_parser = server_subparsers.add_parser("set")
    server_set_parser.add_argument("name")
    server_set_subparsers = server_set_parser.add_subparsers(help="Add/modify storage types, currently support nfs, samba, azurefile and azureblob")
    # ./storagectl.py server set NAME nfs ADDRESS ROOTPATH
    server_set_nfs_parser = server_set_subparsers.add_parser("nfs")
    server_set_nfs_parser.add_argument("address", metavar="address", help="Nfs remote address")
    server_set_nfs_parser.add_argument("root_path", metavar="rootpath", help="Nfs remote root path")
    server_set_nfs_parser.set_defaults(func=server_set, server_type="nfs")
    # ./storagectl.py server set NAME samba ADDRESS ROOTPATH USERNAME PASSWORD DOMAIN
    server_set_samba_parser = server_set_subparsers.add_parser("samba")
    server_set_samba_parser.add_argument("address", metavar="address", help="Samba remote address")
    server_set_samba_parser.add_argument("root_path", metavar="rootpath", help="Samba remote root path")
    server_set_samba_parser.add_argument("user_name", metavar="username", help="Samba PAI username")
    server_set_samba_parser.add_argument("password", metavar="password", help="Samba PAI password")
    server_set_samba_parser.add_argument("domain", metavar="domain", help="Samba PAI domain")
    server_set_samba_parser.set_defaults(func=server_set, server_type="samba")
    # ./storagectl.py server set NAME azurefile DATASTORE FILESHARE ACCOUNTNAME KEY [-p PROXY_ADDRESS PROXY_PASSWORD]
    server_set_azurefile_parser = server_set_subparsers.add_parser("azurefile")
    server_set_azurefile_parser.add_argument("data_store", metavar="datastore", help="Azurefile data store")
    server_set_azurefile_parser.add_argument("file_share", metavar="fileshare", help="Azurefile file share")
    server_set_azurefile_parser.add_argument("account_name", metavar="accountname", help="Azurefile account name")
    server_set_azurefile_parser.add_argument("key", metavar="key", help="Azurefile share key")
    server_set_azurefile_parser.add_argument("-p", "--proxy", dest="proxy", nargs=2, help="Proxy to mount azure file: PROXY_INFO PROXY_PASSWORD")
    server_set_azurefile_parser.set_defaults(func=server_set, server_type="azurefile")
    # ./storagectl.py server set NAME azureblob DATASTORE CONTAINERNAME ACCOUNTNAME KEY
    server_set_azureblob_parser = server_set_subparsers.add_parser("azureblob")
    server_set_azureblob_parser.add_argument("data_store", metavar="datastore", help="Azureblob data store")
    server_set_azureblob_parser.add_argument("container_name", metavar="containername", help="Azureblob container name")
    server_set_azureblob_parser.add_argument("account_name", metavar="accountname", help="Azureblob account name")
    server_set_azureblob_parser.add_argument("key", metavar="key", help="Azureblob share key")
    server_set_azureblob_parser.set_defaults(func=server_set, server_type="azureblob")
    # ./storagectl.py server set NAME hdfs NAMENODE PORT
    server_set_hdfs_parser = server_set_subparsers.add_parser("hdfs")
    server_set_hdfs_parser.add_argument("namenode", metavar="namenode", help="HDFS name node")
    server_set_hdfs_parser.add_argument("port", metavar="port", help="HDFS name node port")
    server_set_hdfs_parser.set_defaults(func=server_set, server_type="hdfs")
    # ./storagectl.py server list [-n SERVER_NAME_1, SERVER_NAME_2 ...]
    server_list_parser = server_subparsers.add_parser("list")
    server_list_parser.add_argument("-n", "--name", dest="name", nargs="+", help="filter result by names")
    server_list_parser.set_defaults(func=show_secret, secret_name="storage-server", namespace="pai-storage")
    # ./storagectl.py server delete SERVER_NAME
    server_del_parser = server_subparsers.add_parser("delete")
    server_del_parser.add_argument("name")
    server_del_parser.set_defaults(func=delete_secret, secret_name="storage-server", namespace="pai-storage")

    # ./storagectl.py config ...
    config_parser = subparsers.add_parser("config", description="Manage config", formatter_class=argparse.RawDescriptionHelpFormatter)
    config_subparsers = config_parser.add_subparsers(help="Manage config")
    # ./storagectl.py config set CONFIG_NAME GROUP_NAME [-s SERVER_NAME_1 SERVER_NAME_2 ...] [-m MOUNT_POINT SERVER PATH]... [-d]
    config_set_parser = config_subparsers.add_parser("set")
    config_set_parser.add_argument("name", help="Config name")
    config_set_parser.add_argument("gpn", help="Config group name")
    config_set_parser.add_argument("-s", "--server", dest="servers", nargs="+", help="-s SERVER_NAME_1 SERVER_NAME_2 ...")
    config_set_parser.add_argument("-m", "--mountinfo", dest="mount_info", nargs=3, action="append", help="-m MOUNT_POINT SERVER PATH")
    config_set_parser.add_argument("-d", "--default", action="store_true", help="Mount by default")
    config_set_parser.set_defaults(func=config_set)
    # ./storagectl.py config list [-n CONFIG_NAME_1, CONFIG_NAME_2 ...] [-g GROUP_NAME_1, GROUP_NAME_2 ...]
    config_list_parser = config_subparsers.add_parser("list")
    config_list_parser.add_argument("-n", "--name", dest="name", nargs="+", help="filter result by names")
    config_list_parser.add_argument("-g", "--group", dest="group", nargs="+", help="filter result by groups")
    config_list_parser.set_defaults(func=show_secret, secret_name="storage-config", namespace="pai-storage")
    # ./storagectl.py config delete CONFIG_NAME
    config_del_parser = config_subparsers.add_parser("delete")
    config_del_parser.add_argument("name")
    config_del_parser.set_defaults(func=delete_secret, secret_name="storage-config", namespace="pai-storage")

    # ./storagectl.py user ...
    user_parser = subparsers.add_parser("user", description="Manage user", formatter_class=argparse.RawDescriptionHelpFormatter)
    user_subparsers = user_parser.add_subparsers(help="Manage user")
    # ./storagectl.py user set USER_NAME SERVER_NAME_1 [SERVER_NAME_2 ...]
    user_set_default_parser = user_subparsers.add_parser("set")
    user_set_default_parser.add_argument("name")
    user_set_default_parser.add_argument("servers", nargs="+", help="")
    user_set_default_parser.set_defaults(func=user_set)
    # ./storagectl.py user list [-n USER_NAME_1, USER_NAME_2 ...]
    user_list_parser = user_subparsers.add_parser("list")
    user_list_parser.add_argument("-n", "--name", dest="name", nargs="+", help="filter result by names")
    user_list_parser.set_defaults(func=show_secret, secret_name="storage-user", namespace="pai-storage")
    # ./storagectl.py user delete USER_NAME
    user_del_parser = user_subparsers.add_parser("delete")
    user_del_parser.add_argument("name")
    user_del_parser.set_defaults(func=delete_secret, secret_name="storage-user", namespace="pai-storage")

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    setup_logger_config(logger)
    main()
