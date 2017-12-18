#!/bin/sh

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

NAMESPACE=${NAMESPACE:-monitortest}
KUBECTL="kubectl  --namespace=\"${NAMESPACE}\""

INSTANCES="daemonset/gpu-exporter
daemonset/node-exporter
deployment/prometheus-deployment
configmap/prometheus-configmap
configmap/grafana-import-dashboards"

for instance in ${INSTANCES}; do
  eval "${KUBECTL} delete --ignore-not-found --now \"${instance}\""
done

PODS=$(eval "${KUBECTL} get pods -o name" | awk '/^pod\/(prometheus-deployment|node-exporter|gpu-exporter)-/ {print $1}' | tr '\n' ' ')
while [ ! "${PODS}" = "" ]; do
  echo "Waiting 1 second for ${PODS}pods to shutdown..."
  sleep 1
  eval "${KUBECTL} delete --now ${PODS}"
  PODS=$(eval "${KUBECTL} get pods -o name" | awk '/^pod\/(prometheus-deployment|node-exporter|gpu-exporter)-/ {print $1}' | tr '\n' ' ')
done

eval "${KUBECTL} get pods"
