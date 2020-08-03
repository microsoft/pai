#!/bin/bash

# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

pushd $(dirname "$0") > /dev/null

PYTHONPATH="../../../deployment" python -m k8sPaiLibrary.maintaintool.update_resource \
    --operation delete --resource statefulset --name database-controller-sts

if kubectl get clusterrolebinding | grep -q "database-controller-role-binding"; then
    kubectl delete clusterrolebinding database-controller-role-binding || exit $?
fi

if kubectl get serviceaccount | grep -q "database-controller-account"; then
    kubectl delete serviceaccount database-controller-account || exit $?
fi

popd > /dev/null
