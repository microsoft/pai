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


account_file="./etc/account.config"
token_file="./etc/token.config"
expiration="$((7*24*60*60))"

rest_server_uri=$REST_SERVER_URI
echo "$TEST_USERNAME:$TEST_PASSWORD" > $account_file


get_auth_token() {
  account="$(cat $account_file)"
  account=(${account//:/ })
  curl -X POST -d "username=${account[0]}" -d "password=${account[1]}" -d "expiration=$expiration" $rest_server_uri/api/v1/token | jq -r ".token" > $token_file
}


while true; do
  printf "\nStarting end to end tests:\n"

  if [ ! -f $token_file ] || [ $(( $(date +%s) - $(stat -c %Y $token_file) )) -gt $expiration ]; then
    get_auth_token
  fi

  # printf "\nTesting service ...\n"
  # bats test_service.sh

  printf "\nTesting hdfs ...\n"
  bats test_hdfs.sh

  printf "\nTesting framework launcher ...\n"
  bats test_launcher.sh

  printf "\nTesting rest server ...\n"
  bats test_rest_server.sh

  printf "\n Sleeping ...\n"
  sleep 1800

done
