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

kubectl proxy --port 8080 &
until ! kubectl get sts | grep -q "k8s-frameworkcontroller-sts"; do
    echo 'Trying to stop framework controller ...'
    curl -X DELETE localhost:8080/apis/apps/v1/namespaces/default/statefulsets/k8s-frameworkcontroller-sts \
        -H "Content-Type: application/json" \
        -d '{"kind":"DeleteOptions","apiVersion":"v1","propagationPolicy":"Foreground"}' > /dev/null 2>&1
    sleep 5
done
kill $!

popd > /dev/null
