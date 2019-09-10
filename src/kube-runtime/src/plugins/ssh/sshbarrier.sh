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

# no set -o errexit because use exitcode to judge ssh connectivity
# no set -o nounset because use empty array to judge end
set -o pipefail

readonly MAX_RETRY_COUNT=20
readonly RETRY_INTERVAL=1

function check_ssh_connection()
{
  ssh -q -o BatchMode=yes -o StrictHostKeyChecking=no $1 "exit 0"
  _RCODE=$?
  return $_RCODE
}


instanceToCheck=()
# Set ssh config for all task role instances
taskRoleInstanceArray=(${PAI_TASK_ROLE_INSTANCES//,/ })
barrierTaskRoles=$@

for i in "${taskRoleInstanceArray[@]}"; do
  instancePair=(${i//:/ })
  taskRole=${instancePair[0]}
  index=${instancePair[1]}

  if [[ $taskRole = $FC_TASKROLE_NAME ]] && [[ $index = $FC_TASK_INDEX ]]; then
    continue
  fi

# If barrier task roles defined, then only check instances for defined task roles. Otherwise check all instances.
  if [ ${#barrierTaskRoles[@]} != 0 ]; then
    if [[ " ${barrierTaskRoles[@]} " =~ " ${taskRole} " ]]; then
      instanceToCheck+=("${taskRole}-${index}")
    fi
  else
    instanceToCheck+=("${taskRole}-${index}")
  fi
done

retryCount=0
while [ ${#instanceToCheck[@]} -ne 0 ]
do
  if [ $retryCount -ge $MAX_RETRY_COUNT ]; then
    echo "SSH barrier reaches max retry count. Failed instances: ${instanceToCheck[*]} Exit..."
    exit 240
  fi

  echo "Trying to SSH to instances: ${instanceToCheck[*]}"

  instanceFailed=()
  for instance in "${instanceToCheck[@]}"; do
    check_ssh_connection "$instance"
    if [ $? -ne 0 ]; then
      instanceFailed+=("$instance")
    fi
  done
  instanceToCheck=(${instanceFailed[*]}) 

  ((retryCount++))
  sleep $RETRY_INTERVAL
done

echo "All ssh connections are established, continue..."
