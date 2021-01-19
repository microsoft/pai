#!/bin/bash

# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

kubectl delete --ignore-not-found --now service docker-registry-cache-service
kubectl delete --ignore-not-found --now pod docker-registry-cache
kubectl delete --ignore-not-found --now configmap registry-config
kubectl delete --ignore-not-found --now secret registry-htpasswd