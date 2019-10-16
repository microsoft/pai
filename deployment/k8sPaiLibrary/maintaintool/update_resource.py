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

"""
Delete k8s resources using AppsV1Api.
"""

from __future__ import print_function

import time
import argparse
from kubernetes import client, config
from kubernetes.client.rest import ApiException


def get_api_resources(apps_v1_api):
    api_resources = {
        'daemonset': {
            'list': apps_v1_api.list_namespaced_daemon_set,
            'delete': apps_v1_api.delete_namespaced_daemon_set
        },
        'statefulset': {
            'list': apps_v1_api.list_namespaced_stateful_set,
            'delete': apps_v1_api.delete_namespaced_stateful_set,
        },
    }
    return api_resources


def delete_resource(apps_v1_api, api_resource, name, namespace='default'):
    api_resources = get_api_resources(apps_v1_api)
    body = client.V1DeleteOptions(
        propagation_policy='Foreground',
        grace_period_seconds=0)

    if api_resource in api_resources:
        api = api_resources[api_resource]
        while True:
            items = api['list'](namespace=namespace).items
            if name not in map(lambda x: x.metadata.name, items):
                break
            print('Trying to stop {} ...'.format(name))
            try:
                api['delete'](name=name, namespace=namespace, body=body)
            except ApiException as e:
                continue
            time.sleep(5)
    else:
        raise Exception('Unsupported resource {}.'.format(api_resource))


def main():
    parser = argparse.ArgumentParser(description='Update service resources.')
    parser.add_argument('--operation', help='operation type')
    parser.add_argument('--resource', help='api resource type')
    parser.add_argument('--name', help='resource name')
    parser.add_argument('--namespace', help='resource namespace', default='default')
    args = parser.parse_args()

    config.load_kube_config()
    apps_v1_api = client.AppsV1Api()
    if (args.operation == 'delete'):
        delete_resource(apps_v1_api, args.resource, args.name, args.namespace)
    else:
        raise Exception('Unknown operation {}.'.format(args.operation))


if __name__ == '__main__':
    main()
