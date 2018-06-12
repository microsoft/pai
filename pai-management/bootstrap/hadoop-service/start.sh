#!/bin/bash

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

pushd $(dirname "$0") > /dev/null

#chmod u+x node-label.sh

/bin/bash node-label.sh

#chmod u+x configmap-create.sh

/bin/bash configmap-create.sh


# Hadoop name node
kubectl create -f hadoop-name-node.yaml

PYTHONPATH="../.." python -m  k8sPaiLibrary.monitorTool.check_node_label_exist -k hadoop-name-node -v "true"
ret=$?

if [ $ret -ne 0 ]; then
    echo "No hadoop-name-node Pod in your cluster"
else
    # wait until all drivers are ready.
    PYTHONPATH="../.." python -m  k8sPaiLibrary.monitorTool.check_pod_ready_status -w -k app -v hadoop-name-node
fi


# Hadoop data node
kubectl create -f hadoop-data-node.yaml

PYTHONPATH="../.." python -m  k8sPaiLibrary.monitorTool.check_node_label_exist -k hadoop-data-node -v "true"
ret=$?

if [ $ret -ne 0 ]; then
    echo "No hadoop-data-node Pod in your cluster"
else
    # wait until all drivers are ready.
    PYTHONPATH="../.." python -m  k8sPaiLibrary.monitorTool.check_pod_ready_status -w -k app -v hadoop-data-node
fi


# Hadoop resource manager
kubectl create -f hadoop-resource-manager.yaml

PYTHONPATH="../.." python -m  k8sPaiLibrary.monitorTool.check_node_label_exist -k hadoop-resource-manager -v "true"
ret=$?

if [ $ret -ne 0 ]; then
    echo "No hadoop-resource-manager Pod in your cluster"
else
    # wait until all drivers are ready.
    PYTHONPATH="../.." python -m  k8sPaiLibrary.monitorTool.check_pod_ready_status -w -k app -v hadoop-resource-manager
fi


# Hadoop node manager
kubectl create -f hadoop-node-manager.yaml

PYTHONPATH="../.." python -m  k8sPaiLibrary.monitorTool.check_node_label_exist -k hadoop-node-manager -v "true"
ret=$?

if [ $ret -ne 0 ]; then
    echo "No hadoop-node-manager Pod in your cluster"
else
    # wait until all drivers are ready.
    PYTHONPATH="../.." python -m  k8sPaiLibrary.monitorTool.check_pod_ready_status -w -k app -v hadoop-node-manager
fi


# Hadoop jobhistory
kubectl create -f hadoop-jobhistory.yaml

PYTHONPATH="../.." python -m  k8sPaiLibrary.monitorTool.check_node_label_exist -k jobhistory -v "true"
ret=$?

if [ $ret -ne 0 ]; then
    echo "No jobhistory Pod in your cluster"
else
    # wait until all drivers are ready.
    PYTHONPATH="../.." python -m  k8sPaiLibrary.monitorTool.check_pod_ready_status -w -k app -v hadoop-jobhistory-service
fi

kubectl create -f one-time-job-hadoop.yaml

popd > /dev/null