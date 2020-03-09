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
set -o errexit
set -o nounset

readonly RETRY_INTERVAL=10

function check_ssh_connection()
{
  ssh -q -o BatchMode=yes -o StrictHostKeyChecking=no $1 "exit 0"
  local _RCODE=$?
  return $_RCODE
}

function get_check_instances() {
  local instancesToCheck=()
  # Set ssh config for all task role instances
  local taskRoleInstances=(${PAI_TASK_ROLE_INSTANCES//,/ })
  for i in "${taskRoleInstances[@]}"; do
    local instancePair=(${i//:/ })
    local taskRole=${instancePair[0]}
    local index=${instancePair[1]}

    if [[ $taskRole = $FC_TASKROLE_NAME ]] && [[ $index = $FC_TASK_INDEX ]]; then
      continue
    fi

    instancesToCheck+=("${taskRole}-${index}")
  done
  echo "${instancesToCheck}"
}

function main() {
  MAX_RETRY_COUNT=1800
  if [[ $# -eq 1 ]]; then
    MAX_RETRY_COUNT=$(( $1 * 60 / RETRY_INTERVAL ))
  fi
  echo "Setting ssh barrier MAX_RETRY_COUNT to ${MAX_RETRY_COUNT}, pool interval is ${RETRY_INTERVAL} seconds"

  retryCount=0
  instancesToCheck="$(get_check_instances)"

  while true
  do
    echo "Trying to SSH to instances: ${instancesToCheck[*]}"

    instanceFailed=()
    
    set +o errexit
    for instance in "${instancesToCheck[@]}"; do
      check_ssh_connection "$instance"
      if [[ $? != 0 ]]; then
        instanceFailed+=("$instance")
      fi
    done
    set -o errexit

    [[ ${#instanceFailed[@]} = 0 ]] && break

    if (( $retryCount >= $MAX_RETRY_COUNT )); then
      echo "SSH barrier reaches max retry count. Failed instances: ${instancesToCheck[*]} Exit..." >&2
      exit 10
    fi

    instancesToCheck=(${instanceFailed[*]}) 
    ((retryCount++))

    sleep $RETRY_INTERVAL
  done

  echo "All ssh connections are established, continue..."
}

main $@