#!/bin/bash

# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

INSTANCES="
deployment/prometheus-pushgateway
"

for instance in ${INSTANCES}; do
  kubectl delete --ignore-not-found --now ${instance} || exit $?
done

