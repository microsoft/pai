#!/bin/sh

NAMESPACE=${NAMESPACE:-monitortest}
KUBECTL="kubectl  --namespace=\"${NAMESPACE}\""

INSTANCES="daemonset/gpu-exporter
daemonset/node-exporter
deployment/prometheus-deployment
deployment/grafana
deployment/grafana-cmd
service/grafana
configmap/prometheus-configmap
configmap/grafana-import-dashboards"

for instance in ${INSTANCES}; do
  eval "${KUBECTL} delete --ignore-not-found --now \"${instance}\""
done

PODS=$(eval "${KUBECTL} get pods -o name" | awk '/^pod\/(prometheus-deployment|node-exporter|gpu-exporter|grafana)-/ {print $1}' | tr '\n' ' ')
while [ ! "${PODS}" = "" ]; do
  echo "Waiting 1 second for ${PODS}pods to shutdown..."
  sleep 1
  eval "${KUBECTL} delete --now ${PODS}"
  PODS=$(eval "${KUBECTL} get pods -o name" | awk '/^pod\/(prometheus-deployment|node-exporter|gpu-exporter|grafana)-/ {print $1}' | tr '\n' ' ')
done

eval "${KUBECTL} get pods"
