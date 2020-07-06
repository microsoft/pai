#!/bin/bash

KUBECONFIG={{kube_config_path}}


kubectl label nodes {{ hostvars[groups['kube-master'][0]].inventory_hostname }} locust-role=master

kubectl apply -f {{ locust_base_dir }}/master.yml