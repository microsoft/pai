#!/bin/bash
set -e

export ANSIBLE_DISPLAY_OK_HOSTS=no
export DISPLAY_SKIPPED_HOSTS=no

while getopts "v:" opt; do
  case $opt in
    v)
      export ANSIBLE_DISPLAY_OK_HOSTS=yes
      export DISPLAY_SKIPPED_HOSTS=yes
      ;;
    \?)
      echo "Invalid option: -$OPTARG"
      exit 1
      ;;
  esac
done

# assume pwd is pai/contrib/kubespray
LAYOUT="$PWD/config/layout.yaml"
CLUSTER_CONFIG="$PWD/config/config.yaml"

echo "layout config file path: ${LAYOUT}"
echo "cluster config file path: ${CLUSTER_CONFIG}"

echo "Saving layout.yaml & config.yaml to ${HOME}/pai-deploy/cluster-cfg"
cp ${LAYOUT} ${HOME}/pai-deploy/cluster-cfg
cp ${CLUSTER_CONFIG} ${HOME}/pai-deploy/cluster-cfg

/bin/bash script/service-boot.sh -c ${CLUSTER_CONFIG}
