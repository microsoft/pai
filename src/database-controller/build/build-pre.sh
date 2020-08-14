#!/bin/bash

# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

pushd $(dirname "$0") > /dev/null

mkdir -m 777 -p "../version"
cp -arf "../../../version/PAI.VERSION" "../version/"
echo `git rev-parse HEAD` > "../version/COMMIT.VERSION"

popd > /dev/null
