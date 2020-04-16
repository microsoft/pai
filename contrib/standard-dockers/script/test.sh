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

if [ $# -ne 1 ]; then
  echo "Usage: bash -x test.sh <docker-image-name>"
  exit 1
else
  imagename=$1
fi

if hash sudo ; then
  DOCKER='sudo docker'
else
  DOCKER='docker'
fi

pushd $(dirname "$0") > /dev/null

cd ../src
srcpath=`pwd`
cd ../script

ls -la ../build/*.dockerfile | awk '{print $9}' | while read path; do
  filename=`basename $path`
  tagname="${filename%.*}"
  package=`echo $tagname | cut -d "-" -f 2 | cut -d "_" -f 1`
  version=`echo $tagname | cut -d "-" -f 2 | cut -d "_" -f 2`
  type=`echo $tagname | cut -d "-" -f 3`
  $DOCKER run -v ${srcpath}:/src "${imagename}:${tagname}" python /src/tester.py \
    --package ${package} \
    --version ${version} \
    --type ${type}
  if [ $? -ne 0 ]; then
    echo "Error when test ${imagename}:${tagname}, abort."
    exit 1
  fi
done

popd > /dev/null