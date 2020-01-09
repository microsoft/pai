#!/bin/bash

cd ${HOME}/pai-deploy/

echo "Copy docker configuration into infra (master) node"
ansible-playbook -i ${HOME}/pai-deploy/cluster-cfg/infra-hosts.yml copy-daemon-openpai-default-runtime.yml --become --become-user=root || exit $?

echo "Copy docker configuration into GPU (worker) node"
ansible-playbook -i ${HOME}/pai-deploy/cluster-cfg/gpu-hosts.yml copy-daemon-openpai-nvidia-runtime.yml --become --become-user=root || exit $?

echo "Setup cluster environment is done"