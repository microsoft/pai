#!/bin/bash

KUBE_TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
NODE_NAME=${MY_NODE_NAME}

curl --insecure --header "Content-Type: application/json-patch+json" \
--header "Authorization: Bearer ${KUBE_TOKEN}" \
--request PATCH \
--data '[{"op": "add", "path": "/status/capacity/hivedscheduler.microsoft.com~1pod-scheduling-enable", "value": "50"}]' \
https://${KUBERNETES_SERVICE_HOST}:${KUBERNETES_PORT_443_TCP_PORT}/api/v1/nodes/${NODE_NAME}/status

sleep infinity