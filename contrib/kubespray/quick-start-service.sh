#!/bin/bash
set -e

# assume pwd is pai/contrib/kubespray
LAYOUT="$PWD/config/layout.yaml"
CLUSTER_CONFIG="$PWD/config/config.yaml"

echo "layout config file path: ${LAYOUT}"
echo "cluster config file path: ${CLUSTER_CONFIG}"

echo "Saving layout.yaml & config.yaml to ${HOME}/pai-deploy/cluster-cfg"
cp ${LAYOUT} ${HOME}/pai-deploy/cluster-cfg
cp ${CLUSTER_CONFIG} ${HOME}/pai-deploy/cluster-cfg

/bin/bash script/service-boot.sh -c ${CLUSTER_CONFIG}
