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

hadoopBinaryDir="/hadoop-binary/"

hadoopBinaryPath="${hadoopBinaryDir}hadoop-2.9.0.tar.gz"
cacheVersion="${hadoopBinaryDir}12940533-12933562-docker_executor-done"


echo "hadoopbinarypath:${hadoopBinaryDir}"

[[ -f $cacheVersion ]] &&
{
    echo "Hadoop ai with patch 12940533-12933562-docker_executor has been built"
    echo "Skip this build precess"
    exit 0
}

[[ ! -f "$hadoopBinaryPath" ]] ||
{

    rm -rf $hadoopBinaryPath

}

docker build -t hadoop-build -f hadoop-ai .

docker run --rm --name=hadoop-build --volume=${hadoopBinaryDir}:/hadoop-binary hadoop-build



# When Changing the patch id, please update the filename here.
touch $cacheVersion

popd > /dev/null
