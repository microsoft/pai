#!/bin/bash

# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

pushd $(dirname "$0") > /dev/null

kubectl apply --overwrite=true -f prometheus-pushgateway-deployment.yaml || exit $?
kubectl apply --overwrite=true -f prometheus-pushgateway-cronjob.yaml || exit $?

sleep 10
# Wait until the service is ready.
PYTHONPATH="../../../deployment" python -m  k8sPaiLibrary.monitorTool.check_pod_ready_status -w -k app -v prometheus-pushgateway || exit $?

popd > /dev/null
