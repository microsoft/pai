#!/bin/bash

# Copyright (c) Microsoft Corporation
# All rights reserved.
#
# MIT License
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
# documentation files (the "Software"), to deal in the Software without restriction, including without limitation
# the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
# to permit persons to whom the Software is furnished to do so, subject to the following conditions:
# The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
# BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
# DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

cluster_type="$1"
cluster_scale="$2"

dev_box_name="dev-box-${cluster_type}-${cluster_scale}"
config_path=${WORKSPACE}/tests/jenkins/${cluster_type}/${cluster_scale}/cluster-configuration

# generate config
bash -Eeuxo pipefail ${WORKSPACE}/tests/jenkins/test_generate_config.sh ${cluster_type} ${cluster_scale} ${config_path}

# Run dev-box
sudo docker run -it -d \
  --name=${dev_box_name} \
  --privileged=true \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --entrypoint /bin/bash \
  ${REGISTRY_URI}/openpai/dev-box:${IMAGE_TAG}

sudo docker cp ${WORKSPACE}/. ${dev_box_name}:/root/pai
sudo docker cp ${config_path}/. ${dev_box_name}:/cluster-configuration

# Work in dev-box
sudo docker exec -i ${dev_box_name} /bin/bash << EOF_DEV_BOX
set -Eeuxo pipefail
cd /root/pai

# 1. bootup kubernetes
python paictl.py cluster k8s-bootup -p /cluster-configuration

# 2. push cluster configuration
echo "pai" | python paictl.py config push -p /cluster-configuration

# 3. start PAI services
kubectl create ns pai-storage || true
echo "pai" | python paictl.py service start
EOF_DEV_BOX
