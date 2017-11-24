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

stop() {
  exitcode=$1
  if [ $exitcode != 0 ]; then
    echo Failed to make Binary Distributions with exitcode $exitcode
  else
    echo Succeed to make Binary Distributions with exitcode $exitcode
  fi
  popd
  exit $exitcode
}

run() {
  echo "\$ ${@}"
  "${@}"
  exitcode=$?
  if [ $exitcode != 0 ]; then
    stop $exitcode
  fi
}

pushd "${0%/*}"

echo Start to make Binary Distributions into directory: dist
run rm -rf dist
run mkdir dist
run mvn clean install
run cp -r target/*-with-dependencies.jar dist
run cp -r bin/* dist
run cp -r conf/* dist
stop 0