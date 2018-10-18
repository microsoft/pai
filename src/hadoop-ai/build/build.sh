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

cd /

wget https://issues.apache.org/jira/secure/attachment/12940533/hadoop-2.9.0.gpu-port.20180920.patch -O hadoop-2.9.0.gpu-port.patch
# patch for webhdfs upload issue when using nginx as a reverse proxy
wget https://issues.apache.org/jira/secure/attachment/12933562/HDFS-13773.patch

git clone https://github.com/apache/hadoop.git

cd hadoop

git checkout branch-2.9.0

cp /hadoop-2.9.0.gpu-port.patch /hadoop
cp /HDFS-13773.patch /hadoop
cp /docker-executor.patch /hadoop

git apply hadoop-2.9.0.gpu-port.patch
git apply HDFS-13773.patch
git apply docker-executor.patch

mvn package -Pdist,native -DskipTests -Dmaven.javadoc.skip=true -Dtar

cp /hadoop/hadoop-dist/target/hadoop-2.9.0.tar.gz /hadoop-binary

echo "Successfully build hadoop 2.9.0 AI"



# When Changing the patch id, please update the filename here.
rm /hadoop-binary/*-done
touch /hadoop-binary/12940533-12933562-docker_executor-done

