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


def get_namespaced_secret(namespace):
    config.load_kube_config()
    try:
        api_instance = client.CoreV1Api()
        api_response = api_instance.list_namespaced_secret(namespace)
        return api_response.items
    except ApiException as e:
        if e.status == 404:
            return []
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('-n', '--namespace', dest="namespace", required=True,
                        help="The secret in which namespace should be backup")
    parser.add_argument('-o', '--output', dest="output", required=True, help="the output file to store ")

    args = parser.parse_args()
    namespaces = args.namespace
    output = args.output
    data = get_namespaced_secret(namespaces)
    output_data = []
    for item in data:
        if 'default-token-' in item.metadata.name:
            continue
        output_data.append({
            'name': item.metadata.name,
            'data': item.data
        })
    with open(output, 'w') as yaml_file:
        yaml.dump(output_data, yaml_file, default_flow_style=False)


if __name__ == "__main__":
    main()
