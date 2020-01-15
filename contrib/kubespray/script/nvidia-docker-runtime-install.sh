#!/bin/bash

cd ${HOME}/pai-deploy/pai/contrib/kubespray

echo "Install nvidia docker runtime"
ansible-playbook -i ${HOME}/pai-deploy/cluster-cfg/gpu-hosts.yml nvidia-docker.yml --become --become-user=root || exit $?
