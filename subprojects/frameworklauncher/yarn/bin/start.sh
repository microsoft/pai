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

pushd "${0%/*}"
if [ "$LAUNCHER_LOG_DIR" = "" ]; then
  export LAUNCHER_LOG_DIR=./logs
fi
export LAUNCHER_OPTS="$LAUNCHER_OPTS -DLAUNCHER_LOG_DIR=$LAUNCHER_LOG_DIR"

export PATH=$PATH:$HADOOP_HOME/bin:$JAVA_HOME/bin
export LD_LIBRARY_PATH=$HADOOP_HOME/lib/native
export HADOOP_CLASSPATH=$(hadoop classpath)
java $LAUNCHER_OPTS -cp *:$CLASSPATH:$HADOOP_CLASSPATH com.microsoft.frameworklauncher.service.Bootstrap
popd