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

# Save server config to k8s secret
def save_secret(secret_name, name, secret_dict):
    secret_dict = dict()
    secret_dict[name] = base64.b64encode(json.dumps(secret_dict))
    patch_secret(secret_name, secret_dict, "default")


def show_secret(args):
    secret_data = get_secret(args.secret_name, "default")
    if secret_data is None:
        logger.info("No secret found.")
    else:
        for key, value in secret_data.iteritems():
            print("{0}\n".format(key))
            print(base64.b64decode(value))

def delete_secret(args):
    delete_secret_content(args.secret_name, args.name, "default")


def server_set(args):
    secret_dict = dict()
    secret_dict["spn"] = args.name
    secret_dict["type"] = args.server_type
    if args.server_type == "nfs":
        secret_dict["address"] = args.address
        secret_dict["rootPath"] = args.root_path
    elif args.server_type == "samba":
        secret_dict["address"] = args.address
        secret_dict["rootPath"] = args.root_path
        secret_dict["userName"] = args.user_name
        secret_dict["password"] = args.password
        secret_dict["domain"] = args.domain
    elif args.server_type == "azurefile" or args.server_type == "azureblob":
        secret_dict["dataStore"] = args.data_store
        secret_dict["fileShare"] = args.file_share
        secret_dict["accountName"] = args.account_name
        secret_dict["key"] = args.key
        if args.proxy is not None:
            secret_dict["proxy"] = args.proxy
    else:
        logger.error("Unknow storage type")
        sys.exit(1)
    save_secret("storag-server", args.name, secret_dict)


def group_set(args):
    secret_dict = dict()
    secret_dict["gpn"] = args.name
    secret_dict["servers"] = args.name
    #TODO: parse mount points
    logger.info("{0}".format(args.mount_info))
    save_secret("storag-group", args.name, secret_dict)


def user_set(args):
    secret_dict = dict()
    secret_dict["upn"] = args.name
    secret_dict["servers"] = args.servers
    save_secret("storag-user", args.name, secret_dict)


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

    # ./storagectl.py server set|list|createpath 
    server_parser = subparsers.add_parser("server", description="Commands to manage servers.", formatter_class=argparse.RawDescriptionHelpFormatter)
    server_subparsers = server_parser.add_subparsers(help="Add/modify, list or delete server")
    # ./storgectl.py server set ...
    server_set_parser = server_subparsers.add_parser("set")
    server_set_parser.add_argument("name")
    server_set_subparsers = server_set_parser.add_subparsers(help="Add/modify storage types, currently support nfs, samba, azurefile and azureblob")
    # ./storagectl.py server set <name> nfs <address> <rootpath>
    server_set_nfs_parser = server_set_subparsers.add_parser("nfs")
    server_set_nfs_parser.add_argument("address", metavar="address", help="Nfs remote address")
    server_set_nfs_parser.add_argument("root_path", metavar="rootpath", help="Nfs remote root path")
    server_set_nfs_parser.set_defaults(func=server_set, server_type="nfs")

    # samba
    server_set_samba_parser = server_set_subparsers.add_parser("samba")
    server_set_samba_parser.add_argument("address", metavar="address", help="Samba remote address")
    server_set_samba_parser.add_argument("root_path", metavar="rootpath", help="Samba remote root path")
    server_set_samba_parser.add_argument("user_name", metavar="username", help="Samba PAI username")
    server_set_samba_parser.add_argument("password", metavar="password", help="Samba PAI password")
    server_set_samba_parser.add_argument("domain", metavar="domain", help="Samba PAI domain")
    server_set_samba_parser.set_defaults(func=server_set, server_type="samba")
    
    # azurefile
    server_set_azurefile_parser = server_set_subparsers.add_parser("azurefile")
    server_set_azurefile_parser.add_argument("data_store", metavar="datastore", help="Azurefile data store")
    server_set_azurefile_parser.add_argument("file_share", metavar="fileshare", help="Azurefile file share")
    server_set_azurefile_parser.add_argument("account_name", metavar="accountname", help="Azurefile account name")
    server_set_azurefile_parser.add_argument("key", metavar="key", help="Azurefile share key")
    server_set_azurefile_parser.add_argument("--proxy", dest="proxy", nargs=1, help="Proxy to mount azure file")
    server_set_azurefile_parser.set_defaults(func=server_set, server_type="azurefile")

    # azureblob
    server_set_azureblob_parser = server_set_subparsers.add_parser("azureblob")
    server_set_azureblob_parser.add_argument("data_store", metavar="datastore", help="Azureblob data store")
    server_set_azureblob_parser.add_argument("file_share", metavar="fileshare", help="Azureblob file share")
    server_set_azureblob_parser.add_argument("account_name", metavar="accountname", help="Azureblob account name")
    server_set_azureblob_parser.add_argument("key", metavar="key", help="Azureblob share key")
    server_set_azureblob_parser.add_argument("--proxy", dest="proxy", nargs=1, help="Proxy to mount azure blob")
    server_set_azureblob_parser.set_defaults(func=server_set, server_type="azureblob")
    
    # server list
    server_list_parser = server_subparsers.add_parser("list")
    server_list_parser.add_argument("-n", "--name", dest="name", nargs="+")
    server_list_parser.set_defaults(func=show_secret_content, secret_name="storage-server")

    # server delete
    server_del_parser = server_subparsers.add_parser("delete")
    server_del_parser.add_argument("name")
    server_del_parser.set_defaults(func=delete_secret, secret_name="storage-server")

    # ./storagectl.py group ...
    group_parser = subparsers.add_parser("group", description="Control group", formatter_class=argparse.RawDescriptionHelpFormatter)
    group_subparsers = group_parser.add_subparsers(help="Manage group")
    # ./storagectl.py group set GROUP_NAME SERVER_NAME_1 SERVER_NAME_2 ...
    group_set_parser = group_subparsers.add_parser("set")
    group_set_parser.add_argument("name")
    group_set_parser.add_argument("servers", nargs="+", help="")
    # --mountinfo MOUNT_POINT SERVER PATH
    group_set_parser.add_argument("--mountinfo", dest="mount_info", nargs=3, help="--mountinfo MOUNT_POINT SERVER_NAME PATH")
    group_set_parser.set_defaults(func=group_set)
    # ./storagectl.py group list
    group_list_parser = group_subparsers.add_parser("list")
    group_list_parser.add_argument("-n", "--name", dest="name", nargs="+")
    group_list_parser.set_defaults(func=show_secret_content, secret_name="storage-group")
    # group delete
    group_del_parser = group_subparsers.add_parser("delete")
    group_del_parser.add_argument("name")
    group_del_parser.set_defaults(func=delete_secret, secret_name="storage-group")

    # ./storagectl.py user set 
    user_parser = subparsers.add_parser("user", description="Control user", formatter_class=argparse.RawDescriptionHelpFormatter)
    user_subparsers = user_parser.add_subparsers(help="Manage user")
    # ./storagectl.py user set USER_NAME SERVER_NAME_1 SERVER_NAME_2 ...
    user_set_default_parser = user_subparsers.add_parser("set")
    user_set_default_parser.add_argument("name")
    user_set_default_parser.add_argument("servers", nargs="+", help="")
    user_set_default_parser.set_defaults(func=user_set)
    # ./storagectl.py user list (-n USER_NAME)
    user_list_parser = user_subparsers.add_parser("list")
    user_list_parser.add_argument("-n", "--name", dest="name", nargs="+")
    user_list_parser.set_defaults(func=show_secret_content, secret_name="storage-user")
    # ./storagectl.py user delete USER_NAME
    user_del_parser = user_subparsers.add_parser("delete")
    user_del_parser.add_argument("name")
    user_del_parser.set_defaults(func=delete_secret, secret_name="storage-user")

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    setup_logger_config(logger)
    main()
