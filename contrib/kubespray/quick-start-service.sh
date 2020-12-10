#!/bin/bash

# assume pwd is pai/contrib/kubespray
CLUSTER_CONFIG="$PWD/config/config.yaml"

echo "cluster config file path: ${CLUSTER_CONFIG}"

/bin/bash script/service-boot.sh -c ${CLUSTER_CONFIG}
