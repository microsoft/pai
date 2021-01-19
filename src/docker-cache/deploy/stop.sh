#!/bin/bash

# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

kubectl delete --ignore-not-found --now -f docker-cache-service.yaml
kubectl delete --ignore-not-found --now -f docker-cache.yaml
kubectl delete --ignore-not-found --now -f docker-cache-config.yaml
kubectl delete --ignore-not-found --now -f docker-cache-secret.yaml
kubectl delete --ignore-not-found --now -f docker-cache-namespace.yaml