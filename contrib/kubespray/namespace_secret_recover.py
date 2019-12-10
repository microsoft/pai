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
import yaml
import os
import argparse
import sys
import time
from kubernetes import client, config
from kubernetes.client.rest import ApiException


def setup_logger_config(logger):
    """
    Setup logging configuration.
    """
    if len(logger.handlers) == 0:
        logger.propagate = False
        logger.setLevel(logging.DEBUG)
        consoleHandler = logging.StreamHandler()
        consoleHandler.setLevel(logging.DEBUG)
        formatter = logging.Formatter('%(asctime)s [%(levelname)s] - %(filename)s:%(lineno)s : %(message)s')
        consoleHandler.setFormatter(formatter)
        logger.addHandler(consoleHandler)


logger = logging.getLogger(__name__)
setup_logger_config(logger)


def create_namespace_if_not_exist(namespace):
    config.load_kube_config()
    try:
        api_instance = client.CoreV1Api()
        api_instance.read_namespace(namespace)
    except ApiException as e:
        if e.status == 404:
            api_instance = client.CoreV1Api()
            meta_data = client.V1ObjectMeta()
            meta_data.name = namespace
            body = client.V1Namespace(
                metadata=meta_data
            )
            api_instance.create_namespace(body)
            return True
        logger.error("Failed to create namespace [{0}]".format(namespace))
        sys.exit(1)
    return False


def create_secret_in_namespace_if_not_exist(namespace, payload):
    config.load_kube_config()
    try:
        api_instance = client.CoreV1Api()
        api_instance.read_namespaced_secret(payload['name'], namespace)
    except ApiException as e:
        if e.status == 404:
            try:
                api_instance = client.CoreV1Api()
                meta_data = client.V1ObjectMeta()
                meta_data.name = payload['name']
                body = client.V1Secret(
                    metadata=meta_data,
                    data=payload['data']
                )
                api_instance.create_namespaced_secret(namespace, body)
            except ApiException as create_e:
                logger.error("Exception when calling CoreV1Api->create_namespaced_secret: %s\n" % create_e)
                sys.exit(1)
        else:
            logger.error("Exception when calling CoreV1Api->read_namespaced_secret: %s\n" % e)
            sys.exit(1)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('-n', '--namespace', dest="namespace", required=True,
                        help="The secret in which namespace should be backup")
    parser.add_argument('-i', '--input', dest="input", required=True, help="the input file to restore data ")
    parser.add_argument('-d', '--delete-backup', dest="delete", default=False, action='store_true')

    args = parser.parse_args()
    namespaces = args.namespace
    input = args.input
    delete_backup = args.delete

    create_namespace_if_not_exist(namespaces)

    with open(input, "r") as f:
        secret_data = yaml.load(f, yaml.SafeLoader)

    for item in secret_data:
        create_secret_in_namespace_if_not_exist(
            namespaces,
            item
        )

    if delete_backup:
        try:
            os.unlink(input)
        except OSError as e:
            logger.exception(e)


if __name__ == "__main__":
    main()
