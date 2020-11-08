#!/bin/bash

# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

kubectl delete --ignore-not-found --now "daemonset/marketplace-restserver-ds"
