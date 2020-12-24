#!/bin/bash

# assume pwd is pai/contrib/kubespray
CLUSTER_CONFIG="$PWD/config/config.yaml"

echo "cluster config file path: ${CLUSTER_CONFIG}"

echo "Generating services configurations..."
sudo python3 script/openpai_generator.py -l ${HOME}/pai-deploy/cluster-cfg/layout.yaml -c ${HOME}/pai-deploy/cluster-cfg/config.yaml -o ${HOME}/pai-deploy/cluster-cfg

/bin/bash script/service-boot.sh -c ${CLUSTER_CONFIG}
