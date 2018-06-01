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

# In this script, you could set several steps to launcher your hbase.
# Here I will define 2 steps. 1) Environment and configuration preparation. 2) service starting.
# And for our target to make this image stateless. We will mount all steps' script with k8s.

#step 1: Environment and configuration preparation
cp /hbase-configuration/${GENERATE_CONFIG}  generate_config.sh
chmod u+x generate_config.sh
./generate_config.sh

#step 2: Service starting.
cp /hbase-configuration/${START_SERVICE}  start_service.sh
chmod u+x start_service.sh

# This status check is mainly for ensuring the status of image pulling.
# And usually this process costs most of the time when creating a new pod in kubernetes.
mkdir -p /jobstatus
touch /jobstatus/jobok

./start_service.sh
