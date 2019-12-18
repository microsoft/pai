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

cluster_or_singlebox="$1"
dev_box_name="dev-box-yarn-${cluster_or_singlebox}"

config_path=${JENKINS_HOME}/${BED}/${cluster_or_singlebox}/cluster-configuration
quick_start_path=${JENKINS_HOME}/${BED}/${cluster_or_singlebox}/quick-start

# generate config
bash ${WORKSPACE}/tests/jenkins/test_generate_config.sh ${cluster_or_singlebox} ${config_path} ${quick_start_path}

# Run dev-box
# Assume the path of custom-hadoop-binary-path in service-configuration is /pathHadoop.
# Assume the directory path of cluster-configuration is /pathConfiguration.
# By now, you can leave it as it is, we only mount those two directories into docker container for later usage.
sudo docker run -it -d \
  --name=${dev_box_name} \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /var/lib/jenkins/scripts:/jenkins/scripts \
  -v /pathHadoop:/pathHadoop \
  -v ${config_path}:/cluster-configuration \
  -v ${quick_start_path}:/quick-start \
  --privileged=true \
  ${REGISTRY_URI}/openpai/dev-box:${IMAGE_TAG} nofetch

sudo docker exec ${dev_box_name} rm -rf /pai
sudo docker cp ${WORKSPACE} ${dev_box_name}:/pai

# Work in dev-box
sudo docker exec -i ${dev_box_name} /bin/bash << EOF_DEV_BOX
set -ex
cd /pai

# 1. bootup kubernetes
python paictl.py cluster k8s-bootup -p /cluster-configuration
sleep 10s

# 2. push cluster configuration
echo "pai" | python paictl.py config push -p /cluster-configuration

# 3. start PAI services
echo "pai" | python paictl.py service start
EOF_DEV_BOX
