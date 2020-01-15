#!/bin/bash

cd ${HOME}/pai-deploy/pai/contrib/kubespray

echo "Install nvidia drivers to the machine"
ansible-playbook -i ${HOME}/pai-deploy/cluster-cfg/gpu-hosts.yml nvidia-drivers.yml --become --become-user=root || exit $?

echo "Enable nvidia persistent mode"
ansible-playbook -i ${HOME}/pai-deploy/cluster-cfg/gpu-hosts.yml nvidia-persistent-mode.yml --become --become-user=root || exit $?
