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

mkdir -p ${HOME}/pai-deploy/quick-start-config/
cp ${WORKER_LIST} ${HOME}/pai-deploy/quick-start-config/worker.csv
cp ${MASTER_LIST} ${HOME}/pai-deploy/quick-start-config/master.csv
cp ${CLUSTER_CONFIG} ${HOME}/pai-deploy/quick-start-config/config.yml

cp ${HOME}/pai-deploy/pai/contrib/kubespray/quick-start/layout.yaml.template ${HOME}/pai-deploy/quick-start-config/
cp ${HOME}/pai-deploy/pai/contrib/kubespray/quick-start/services-configuration.yaml.template ${HOME}/pai-deploy/quick-start-config/
