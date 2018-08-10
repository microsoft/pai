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

hadoopbinarypath=$1
hadoopbinarypath_dirname=$(dirname "${hadoopbinarypath}")


echo "the driname of the hadoopbinarypath is : $hadoopbinarypath_dirname"


[[ -f "${hadoopbinarypath_dirname}/12932984-done" ]] &&
{
    echo "Hadoop ai with patch 12932984 has been built"
    echo "Skip this build precess"
    exit 0
}

[[ ! -f "$hadoopbinarypath" ]] ||
{

    rm -rf $hadoopbinarypath

}

tmppath=$hadoopbinarypath
hadoopdirpath=$(dirname "${tmppath}")


docker build -t hadoop-build ./../../../../hadoop-ai/hadoop-build/

docker run --rm --name=hadoop-build --volume=${hadoopdirpath}:/hadoop-binary hadoop-build


popd > /dev/null



