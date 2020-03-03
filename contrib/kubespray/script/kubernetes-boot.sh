#!/bin/bash

echo "setup k8s cluster"
cd ${HOME}/pai-deploy/kubespray
ansible-playbook -i inventory/pai/hosts.yml cluster.yml --become --become-user=root -e "@inventory/pai/openpai.yml" || exit $?

mkdir -p ${HOME}/pai-deploy/kube
cp -rf ${HOME}/pai-deploy/kubespray/inventory/pai/artifacts/admin.conf ${HOME}/pai-deploy/kube/config

while true; do
    read -p "Do you wish to setup kubectl on you local host?" yn
    case $yn in
        [Yy]* )
            cd ${HOME}/pai-deploy/pai/contrib/kubespray
            ansible-playbook -i ${HOME}/pai-deploy/kubespray/inventory/pai/hosts.yml set-kubectl.yml --ask-become-pass
            exit 0
            ;;
        [Nn]* )
            exit 0
            ;;
        * )
            echo "Please answer yes or no."
            ;;
    esac
done