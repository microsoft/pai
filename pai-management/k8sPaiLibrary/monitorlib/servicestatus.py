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

import yaml
import os
import sys
from kubernetes import client, config
from kubernetes.client.rest import ApiException



# To check a service ready or not.
# Note that service name should be same as the app-name in
#     labels:
#        app: app-name
def is_service_ready(servicename):

    label_selector_str="app={0}".format(servicename)

    config.load_kube_config()
    v1 = client.CoreV1Api()

    try:
        pod_list = v1.list_pod_for_all_namespaces(label_selector=label_selector_str, watch=False)
    except ApiException as e:
        print "Exception when calling CoreV1Api->list_pod_for_all_namespaces: %s\n" % e
        sys.exit(1)

    if len(pod_list.items) == 0:
        return False

    for pod in pod_list.items:

        for container in pod.status.container_statuses:
            if container.ready != True:
                return False

    return True

