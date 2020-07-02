#!/bin/bash

KUBECONFIG={{kube_config_path}}

{% for host in groups['kube-worker'] %}
kubectl label nodes {{ hostvars[host].inventory_hostname }} locust-role-
kubectl label nodes {{ hostvars[host].inventory_hostname }} no-jobexporter-
{% endfor %}

kubectl delete deployment locust-worker-deployment

kubectl label nodes {{ hostvars[groups['kube-master'][0]].inventory_hostname }} locust-role-

kubectl delete daemonset locust-master

kubectl delete configmap locust-script-configuration
kubectl delete ClusterRoleBinding locust-role-binding
kubectl delete ClusterRole locust-role
kubectl delete ServiceAccount locust-account