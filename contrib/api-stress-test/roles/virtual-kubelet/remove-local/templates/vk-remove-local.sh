#!/bin/bash

KUBECONFIG={{kube_config_path}}

kubectl --kubeconfig=${KUBECONFIG} delete node -l type=virtual-kubelet