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

pushd $(dirname "$0") > /dev/null

#chmod u+x configmap-create.sh

/bin/bash configmap-create.sh || exit $?

#chmod u+x node-label.sh

/bin/bash node-label.sh || exit $?

i=0

while !  kubectl get configmap | grep -q "grafana-configuration" 
do
  sleep 3
  echo "grafana-configuration configmap does not exist, try to create grafana configmap"
  /bin/bash configmap-create.sh
  i=`expr $i + 1`;
  if [ $i -gt 5 ]; then
  	echo "grafana-configuration configmap create failed > 5 times, stop deployment, please check and fix it"
  	exit 1
  fi
done

kubectl apply --overwrite=true -f grafana.yaml || exit $?

popd > /dev/null
