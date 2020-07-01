#!/bin/bash

KUBECONFIG={{kube_config_path}}

kubectl create configmap locust-script-configuration --from-file={{ locust_base_dir }}/configmap/ --dry-run -o yaml | kubectl apply --overwrite=true -f - || exit $?

kubectl create -f {{ locust_base_dir }}/locust-sa.yml