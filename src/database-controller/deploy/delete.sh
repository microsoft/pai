#!/bin/bash

# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

pushd $(dirname "$0") > /dev/null

echo "Call stop script to stop all service first"
/bin/bash stop.sh || exit $?


popd > /dev/null
