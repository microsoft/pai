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
rest_server_uri="$2"
job_name="e2e-test-$RANDOM-$RANDOM"
pytorch_mnist_name="pytorch-mnist-$RANDOM-$RANDOM"

job_config=$(cat << EOF
{
  "jobName": "${job_name}",
  "image": "docker.io/openpai/alpine:bash",
  "taskRoles": [
    {
      "name": "test",
      "taskNumber": 1,
      "cpuNumber": 1,
      "memoryMB": 2048,
      "command": "/bin/bash --version"
    }
  ]
}
EOF
)

# get token
token=""
until [ ! -z ${token} ]; do
  token=$(curl -sS -X POST -d "username=admin" -d "password=admin-password" -d "expiration=36000" ${rest_server_uri}/api/v1/authn/basic/login | jq -r ".token")
  sleep 10s
done

# check job status
function check_status() {
  while true; do
    sleep 30s
    status=$(curl -sS "$1" | jq -r ".jobStatus.state")
    case ${status} in
      "SUCCEEDED") break ;;
      "WAITING"|"RUNNING") ;;
      *) exit 1 ;;
    esac
  done
}

case ${cluster_type} in
  "yarn")
    # submit v1 job
    echo ${job_config} \
      | curl -sS -X POST -H "Authorization: Bearer ${token}" -H "Content-Type: application/json" -d @- ${rest_server_uri}/api/v2/user/admin/jobs
    check_status ${rest_server_uri}/api/v2/user/admin/jobs/${job_name}
    ;;
  "k8s")
    # submit pytorch mnist example in marketplace
    cat ${WORKSPACE}/marketplace-v2/pytorch-mnist.yaml \
      | sed "s/pytorch_mnist/${pytorch_mnist_name}/g" \
      | curl -sS -X POST -H "Authorization: Bearer ${token}" -H "Content-Type: text/yaml" --data-binary @- ${rest_server_uri}/api/v2/jobs
    check_status ${rest_server_uri}/api/v2/jobs/admin~${pytorch_mnist_name}
    ;;
  *)
    echo "Unknown cluster type ${cluster_type}"
    exit 1
    ;;
esac
