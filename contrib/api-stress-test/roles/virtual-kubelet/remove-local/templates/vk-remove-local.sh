#!/bin/bash

export KUBECONFIG={{kube_config_path}}

kubectl delete node -l type=virtual-kubelet  --kubeconfig=${KUBECONFIG}