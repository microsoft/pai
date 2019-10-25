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

/bin/bash stop.sh || exit $?

echo "Delete pai-user namespace"
if kubectl get namespace | grep -q "pai-user "; then
    kubectl delete ns pai-user || exit $?
fi

echo "Delete pai-user-v2 namespace"
if kubectl get namespace | grep -q "pai-user-v2 "; then
    kubectl delete ns pai-user-v2 || exit $?
fi

echo "Delete pai-group namespace"
if kubectl get namespace | grep -q "pai-group "; then
    kubectl delete ns pai-group || exit $?
fi

echo "Delete pai-storage namespace"
if kubectl get namespace | grep -q "pai-storage "; then
    kubectl delete ns pai-storage || exit $?
fi

echo "Delete pai-user-token namespace"
if kubectl get namespace | grep -q "pai-user-token "; then
    kubectl delete ns pai-user-token || exit $?
fi


popd > /dev/null
