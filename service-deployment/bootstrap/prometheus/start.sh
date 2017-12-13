#!/bin/bash

pushd $(dirname "$0") > /dev/null

chmod u+x node-label.sh

./node-label.sh

NAMESPACE=${NAMESPACE:-monitortest}
KUBECTL="kubectl  --namespace=\"${NAMESPACE}\""
eval "kubectl create namespace \"${NAMESPACE}\""

# (1) create configmap
eval "${KUBECTL} create -f prometheus-configmap.yaml"
eval "${KUBECTL} create configmap grafana-import-dashboards --from-file=dashboards -o json --dry-run" | eval "${KUBECTL} apply -f -"

# (2) create the pods
eval "${KUBECTL} create -f gpu-exporter-ds.yaml"
eval "${KUBECTL} create -f node-exporter-ds.yaml"
eval "${KUBECTL} create -f prometheus-deployment.yaml"
eval "${KUBECTL} create -f grafana.yaml"
eval "${KUBECTL} create -f grafana-cmd.yaml"
eval "${KUBECTL} get pods"

popd > /dev/null