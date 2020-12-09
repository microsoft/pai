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
python3 ${HOME}/pai-deploy/pai/contrib/kubespray/script/k8s-generator.py -l ${LAYOUT} -c ${CLUSTER_CONFIG} -o ${HOME}/pai-deploy/cluster-cfg || exit $?

cp ${HOME}/pai-deploy/cluster-cfg/openpai.yml ${HOME}/pai-deploy/kubespray/inventory/pai/
cp ${HOME}/pai-deploy/cluster-cfg/hosts.yml ${HOME}/pai-deploy/kubespray/inventory/pai/
