#!/bin/bash

KUBECONFIG={{kube_config_path}}

{% for host in groups['kube-worker'] %}
kubectl label nodes {{ hostvars[host].inventory_hostname }} locust-role=worker
{% endfor %}

kubectl create -f {{ locust_base_dir }}/worker.yml