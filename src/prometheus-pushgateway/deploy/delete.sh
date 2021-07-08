#!/bin/bash

# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

pushd $(dirname "$0") > /dev/null

echo "Call stop to stop service first"
/bin/bash stop.sh || exit $?

popd > /dev/null
