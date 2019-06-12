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

# Clean running job

if which docker > /dev/null && [ -S /var/run/docker.sock ]; then

    echo "Clean hadoop jobs"

    # Mitigation: Docker daemon might hang by some zombie container, so this deletion is best-effort
    docker ps | awk '/container_\w{3}_[0-9]{13}_[0-9]{4}_[0-9]{2}_[0-9]{6}/ { print $NF}' | xargs timeout 30 docker stop || \
    docker ps | awk '/container_\w{3}_[0-9]{13}_[0-9]{4}_[0-9]{2}_[0-9]{6}/ { print $NF}' | xargs timeout 30 docker kill
fi


# Clean data

echo "Clean the hadoop node manager's data on the disk"

if [ -d "/mnt/yarn/node" ]; then

    rm -rf /mnt/yarn/node

fi

if [ -d "/mnt/hadooptmp/nodemanager" ]; then

    rm -rf /mnt/hadooptmp/nodemanager

fi

if [ -d "/mnt/pai-service-log/node-manager" ]; then

    rm -rf /mnt/pai-service-log/node-manager

fi
