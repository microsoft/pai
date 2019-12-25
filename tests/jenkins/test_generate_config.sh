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
config_path="$3"

# prepare path
mkdir -p ${config_path}
rm -rf ${config_path}/*.yaml

# generate quick-start and config
case ${cluster_type} in
  "yarn")
    envsubst < ${WORKSPACE}/tests/jenkins/config_${cluster_type}_${cluster_scale}.yaml > ${config_path}/quick-start.yaml
    python paictl.py config generate -i ${config_path}/quick-start.yaml -o ${config_path}
    ;;
  "k8s")
    cp ${JENKINS_HOME}/config/${cluster_type}/${cluster_scale}/*.yaml ${config_path}
    ;;
  *)
    echo "Unknown cluster type ${cluster_type}"
    exit 1
    ;;
esac
# update image tag
sed -i "s/tag: \\(latest\\|v[[:digit:]]\\+.[[:digit:]]\\+.[[:digit:]]\\+\\)/tag: ${IMAGE_TAG}/" ${config_path}/services-configuration.yaml
# update registry
sed -i "s/docker.io/${REGISTRY_URI}/g" ${config_path}/services-configuration.yaml
