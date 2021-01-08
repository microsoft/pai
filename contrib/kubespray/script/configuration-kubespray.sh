#!/bin/bash

while getopts "l:c:" opt; do
  case $opt in
    l)
      LAYOUT=$OPTARG
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

mkdir -p ${HOME}/pai-deploy/cluster-cfg


LOCAL_PAI_PATH=$(realpath $PWD/../..)
echo "Local pai folder path: $LOCAL_PAI_PATH"

echo "Generating kubespray configuration"
python3 ${LOCAL_PAI_PATH}/contrib/kubespray/script/k8s_generator.py -l ${LAYOUT} -c ${CLUSTER_CONFIG} -o ${HOME}/pai-deploy/cluster-cfg || exit $?

cp ${HOME}/pai-deploy/cluster-cfg/openpai.yml ${HOME}/pai-deploy/kubespray/inventory/pai/
cp ${HOME}/pai-deploy/cluster-cfg/hosts.yml ${HOME}/pai-deploy/kubespray/inventory/pai/
