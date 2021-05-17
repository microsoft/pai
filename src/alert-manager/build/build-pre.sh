#!/bin/bash

# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

pushd $(dirname "$0") > /dev/null

cp -arfT "../../database-controller/sdk" "../src/job-status-change-notification/openpaidbsdk"

popd > /dev/null
