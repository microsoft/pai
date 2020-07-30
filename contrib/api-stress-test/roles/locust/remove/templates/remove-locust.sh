#!/bin/bash

KUBECONFIG={{kube_config_path}}

{% for host in groups['kube-worker'] %}
kubectl --kubeconfig=${KUBECONFIG} label nodes {{ hostvars[host].inventory_hostname }} locust-role-
{% endfor %}

kubectl --kubeconfig=${KUBECONFIG} delete deployment locust-worker-deployment

kubectl --kubeconfig=${KUBECONFIG} label nodes {{ hostvars[groups['kube-master'][0]].inventory_hostname }} locust-role-

kubectl --kubeconfig=${KUBECONFIG} delete daemonset locust-master

kubectl --kubeconfig=${KUBECONFIG} delete configmap locust-script-configuration
kubectl --kubeconfig=${KUBECONFIG} delete ClusterRoleBinding locust-role-binding
kubectl --kubeconfig=${KUBECONFIG} delete ClusterRole locust-role
kubectl --kubeconfig=${KUBECONFIG} delete ServiceAccount locust-account