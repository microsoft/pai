#!/bin/bash

KUBECONFIG={{kube_config_path}}

{% for host in groups['kube-worker'] %}
kubectl --kubeconfig=${KUBECONFIG} label nodes {{ hostvars[host].inventory_hostname }} locust-role=worker
kubectl --kubeconfig=${KUBECONFIG} label nodes {{ hostvars[host].inventory_hostname }} no-jobexporter=true
{% endfor %}

kubectl --kubeconfig=${KUBECONFIG} apply -f {{ locust_base_dir }}/worker.yml