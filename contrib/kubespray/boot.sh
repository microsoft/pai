#!/bin/bash

while getopts "w:m:c:" opt; do
  case $opt in
    w)
      WORKER_LIST=$OPTARG
      ;;
    m)
      MASTER_LIST=$OPTARG
      ;;
    c)
      CLUSTER_CONFIG=$OPTARG
      ;;
    \?)
      echo "Invalid option: -$OPTARG"
      exit 1
      ;;
  esac
done

echo "worker list file path: ${WORKER_LIST}"
echo "master list file path: ${MASTER_LIST}"
echo "cluster config file path: ${CLUSTER_CONFIG}"

if [ ! -f "${WORKER_LIST}" ]
then
  echo "Error: Can't find worker list file in the path ${WORKER_LIST}！"
  exit 1
fi

if [ ! -f "${MASTER_LIST}" ]
then
  echo "Error: Can't find master list file in the path ${MASTER_LIST}！"
  exit 1
fi

if [ ! -f "${CLUSTER_CONFIG}" ]
then
  echo "Error: Can't find master list file in the path ${CLUSTER_CONFIG}！"
  exit 1
fi

/bin/bash script/environment.sh -c ${CLUSTER_CONFIG} || exit $?

/bin/bash script/configuration.sh -m ${MASTER_LIST} -w ${WORKER_LIST} -c ${CLUSTER_CONFIG} || exit $?

echo "Generate SSH Key"

rm -rf ${HOME}/.ssh/known_hosts

ssh-keygen -t rsa -f ~/.ssh/id_rsa -P ""

ansible-playbook -i ${HOME}/pai-deploy/cluster-cfg/hosts.yml passwordless-ssh.yml || exit $?

ansible-playbook -i ${HOME}/pai-deploy/cluster-cfg/hosts.yml drivers-install.yml || exit $?

ansible-playbook -i ${HOME}/pai-deploy/cluster-cfg/hosts.yml docker-runtime-setup.yml || exit $?

ansible-playbook -i ${HOME}/pai-deploy/cluster-cfg/hosts.yml set-host-daemon-port-range.yml || exit $?

/bin/bash requirement.sh -m ${MASTER_LIST} -w ${WORKER_LIST} -c ${CLUSTER_CONFIG} || exit $?

/bin/bash script/kubernetes-boot.sh || exit $?

/bin/bash script/service-boot.sh -c ${CLUSTER_CONFIG} || exit $?
