#!/bin/bash -x

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

CONFIG_RUNTIME=false

if [ "$#" -eq "1" -a "$1" == "--config-runtime" ] ; then
    CONFIG_RUNTIME=true
fi

echo CONFIG_RUNTIME is $CONFIG_RUNTIME

function configDockerRuntime {
    cp /etc/docker/daemon.json /etc/docker/daemon.json.before_config_runtime

    jq -s '.[0] * .[1]' docker-config-with-nvidia-runtime.json /etc/docker/daemon.json > tmp
    mv tmp /etc/docker/daemon.json

    pkill -SIGHUP dockerd
}

function dockerRuntimeConfigured {
    cat /etc/docker/daemon.json | jq -e 'has("default-runtime")' &> /dev/null
    return $?
}

if test $CONFIG_RUNTIME == "true" && ! dockerRuntimeConfigured ; then
    configDockerRuntime
fi
