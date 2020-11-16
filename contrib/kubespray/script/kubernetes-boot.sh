#!/bin/bash

echo "setup k8s cluster"
cd ${HOME}/pai-deploy/kubespray
ansible-playbook -i inventory/pai/hosts.yml cluster.yml --become --become-user=root -e "@inventory/pai/openpai.yml" || exit $?

mkdir -p ${HOME}/pai-deploy/kube
cp -rf ${HOME}/pai-deploy/kubespray/inventory/pai/artifacts/admin.conf ${HOME}/pai-deploy/kube/config

echo "You can run the following commands to setup kubectl on you local host:"
echo "ansible-playbook -i ${HOME}/pai-deploy/kubespray/inventory/pai/hosts.yml ${HOME}/pai-deploy/pai/contrib/kubespray/set-kubectl.yml --ask-become-pass"
