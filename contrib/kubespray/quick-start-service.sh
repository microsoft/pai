#!/bin/bash

# assume pwd is pai/contrib/kubespray
LAYOUT="$PWD/config/layout.yaml"
CLUSTER_CONFIG="$PWD/config/config.yaml"

echo "layout config file path: ${LAYOUT}"
echo "cluster config file path: ${CLUSTER_CONFIG}"

# prepare quick-start-config folder
/bin/bash script/configuration-services.sh -l ${LAYOUT} -c ${CLUSTER_CONFIG} || exit $?

/bin/bash script/service-boot.sh -c ${CLUSTER_CONFIG}
