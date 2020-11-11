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

# environment set up
/bin/bash script/environment.sh -c ${CLUSTER_CONFIG} || exit $?

# check requirements
/bin/bash requirement.sh -m ${MASTER_LIST} -w ${WORKER_LIST} -c ${CLUSTER_CONFIG}
ret_code_check=$?
if [ $ret_code_check -ne 0 ]; then
  echo ""
  echo "Please press ENTER to stop the script, check the log, and modify the cluster setting to meet the requirements."
  echo "If you are very sure about the configuration, and still want to continue, you can type in \"continue\" to force the script to proceed."
  read user_input
  if [ "${user_input}"x != "continue"x ]; then
    exit $ret_code_check
  fi
fi

# prepare cluster-cfg folder
/bin/bash script/configuration-kubespray.sh -m ${MASTER_LIST} -w ${WORKER_LIST} -c ${CLUSTER_CONFIG} || exit $?

echo "Ping Test"
ansible all -i ${HOME}/pai-deploy/cluster-cfg/hosts.yml -m ping || exit $?

/bin/bash preinstall.sh -c ${CLUSTER_CONFIG} || exit $?

# setup k8s cluster
/bin/bash script/kubernetes-boot.sh || exit $?
