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

scriptPath=$1

# Install python for json join tool.
if command -v python >/dev/null 2>&1; then
    echo python has been installed. And skip python install.
else
    apt-get update
    apt-get -y install python
    if command -v python >/dev/null 2>&1; then
        echo Successfully install python
    else
        echo Failed install python
        exit 1
    fi
fi

# Prepare docker for remote host
if command -v docker >/dev/null 2>&1; then
    echo docker has been installed. And skip docker install.
else
    apt-get update
    apt-get -y install \
               apt-transport-https \
               ca-certificates \
               curl \
               software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
    apt-key fingerprint 0EBFCD88

    # Suppose your host is amd64.
    add-apt-repository \
        "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) \
        stable"

    apt-get update

    apt-get -y install docker-ce

    docker run hello-world

    if command -v docker >/dev/null 2>&1; then
        echo Successfully install docker
    else
        echo Failed install docker
        exit 1
    fi
fi

if command -v nvidia-container-runtime >/dev/null 2>&1; then
    echo nvidia container runtime has been installed. Skip this.
else
    apt-get -y install nvidia-container-runtime
fi

[[ ! -d "/etc/docker" ]] &&
{
    mkdir -p /etc/docker
}

[[ ! -f "/etc/docker/daemon.json" ]] &&
{
    cp $scriptPath/docker-daemon.json /etc/docker/daemon.json
}

python $scriptPath/docker-config-update.py -s $scriptPath/docker-daemon.json -d /etc/docker/daemon.json

systemctl restart docker
