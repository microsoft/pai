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


# Edit /etc/hosts file for remote host

# set host ip
hostip=$1

# Change 127.0.0.1 line to "127.0.0.1 localhost $hostname"
grep -q "127.0.0.1" /etc/hosts && \
    sed -i "/127.0.0.1/c\127.0.0.1 localhost $(hostname)" /etc/hosts || \
    sed -i "\$a127.0.0.1 localhost $(hostname)" /etc/hosts

# Comment 127.0.1.1 line
sed -i "/127.0.1.1/s/^/# /" /etc/hosts

# Comment hostip line
sed -i "/$hostip/s/^/# /" /etc/hosts

# Change hostip line to "$hostip $hostname"
# grep -q "$hostip" /etc/hosts && \
#     sed -i "/$hostip/c\\$hostip $(hostname)" /etc/hosts || \
#     sed -i "\$a$hostip $(hostname)" /etc/hosts


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

    sudo docker run hello-world

    if command -v docker >/dev/null 2>&1; then
        echo Successfully install docker
    else
        echo Failed install docker
        exit 1
    fi
fi

# check etc/ exist or not.
staticpod="add-worker-node/etc"
if [ -d "$staticpod" ]; then

    cp -r add-worker-node/etc /

fi

chmod u+x add-worker-node/kubelet.sh
./add-worker-node/kubelet.sh
