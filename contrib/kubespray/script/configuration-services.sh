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

mkdir -p ${HOME}/pai-deploy/quick-start-config/
cp ${LAYOUT} ${HOME}/pai-deploy/quick-start-config/layout.yaml
cp ${CLUSTER_CONFIG} ${HOME}/pai-deploy/quick-start-config/config.yaml

cp ${HOME}/pai-deploy/pai/contrib/kubespray/quick-start/services-configuration.yaml.template ${HOME}/pai-deploy/quick-start-config/
