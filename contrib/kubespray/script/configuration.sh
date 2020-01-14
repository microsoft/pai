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

cd ${HOME}/pai-deploy/pai/contrib/kubespray
mkdir -p ${HOME}/pai-deploy/cluster-cfg
python3 ${HOME}/pai-deploy/pai/contrib/kubespray/script/generator.py -m ${MASTER_LIST} -w ${WORKER_LIST} -c ${CLUSTER_CONFIG} -o ${HOME}/pai-deploy/cluster-cfg

cp ${HOME}/pai-deploy/pai/contrib/kubespray/quick-start/openpai.yml ${HOME}/pai-deploy/cluster-cfg
cp ${HOME}/pai-deploy/pai/contrib/kubespray/quick-start/openpai.yml ${HOME}/pai-deploy/kubespray/inventory/pai/
cp ${HOME}/pai-deploy/cluster-cfg/hosts.yml ${HOME}/pai-deploy/kubespray/inventory/pai/