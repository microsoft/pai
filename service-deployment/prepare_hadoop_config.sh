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

# Download an official hadoop binary, and get the original configuration of hadoop.
# Then apply our patch to the configuration to get our environment configuration.
# When deploying it to your cluster, you can directly mv your configuration to the destination file.
wget http://archive.apache.org/dist/hadoop/common/hadoop-2.7.2/hadoop-2.7.2.tar.gz

tar -xvzf hadoop-2.7.2.tar.gz -C src/hadoop-run/
cp -r src/hadoop-run/hadoop-2.7.2/etc/hadoop .
rm -rf src/hadoop-run/hadoop-2.7.2
rm -rf hadoop-2.7.2.tar.gz

# prepare original config of hadoop for hadoop-run
cp hadoop/hadoop-env.sh src/hadoop-run/hadoop-env.sh
cp hadoop/mapred-site.xml.template src/hadoop-run/mapred-site.xml
cp hadoop/yarn-env.sh src/hadoop-run/yarn-env.sh



cp hadoop/core-site.xml bootstrap/hadoop-service/hadoop-configuration/core-site.xml

# prepare original config of hadoop for data-node
cp hadoop/hdfs-site.xml bootstrap/hadoop-service/hadoop-configuration/datanode-hdfs-site.xml

# prepare original config of hadoop for jobhistory
cp hadoop/mapred-site.xml.template bootstrap/hadoop-service/hadoop-configuration/jobhistory-mapred-site.xml
cp hadoop/yarn-site.xml bootstrap/hadoop-service/hadoop-configuration/jobhistory-yarn-site.xml

# prepare original config of hadoop for name-node
cp hadoop/hdfs-site.xml bootstrap/hadoop-service/hadoop-configuration/namenode-hdfs-site.xml

# prepare original config of hadoop for node-manager
cp hadoop/mapred-site.xml.template bootstrap/hadoop-service/hadoop-configuration/nodemanager-mapred-site.xml
cp hadoop/yarn-site.xml bootstrap/hadoop-service/hadoop-configuration/nodemanager-yarn-site.xml

# prepare original config of hadoop for resource-manager
cp hadoop/mapred-site.xml.template bootstrap/hadoop-service/hadoop-configuration/resourcemanager-mapred-site.xml
cp hadoop/yarn-site.xml bootstrap/hadoop-service/hadoop-configuration/resourcemanager-yarn-site.xml


# patch for hadoop-run
patch src/hadoop-run/hadoop-env.sh config-patch/hadoop-env.sh.patch
patch src/hadoop-run/mapred-site.xml config-patch/mapred-site.xml.patch
patch src/hadoop-run/yarn-env.sh config-patch/yarn-env.sh.patch


patch bootstrap/hadoop-service/hadoop-configuration/core-site.xml config-patch/core-site.xml.patch

# patch for data-node
patch bootstrap/hadoop-service/hadoop-configuration/datanode-hdfs-site.xml config-patch/datanode-hdfs-site.xml.patch

# patch for jobhistory
patch bootstrap/hadoop-service/hadoop-configuration/jobhistory-mapred-site.xml config-patch/jobhistory-mapred-site.xml.patch
patch bootstrap/hadoop-service/hadoop-configuration/jobhistory-yarn-site.xml config-patch/jobhistory-yarn-site.xml.patch

# patch for name-node
patch bootstrap/hadoop-service/hadoop-configuration/namenode-hdfs-site.xml config-patch/namenode-hdfs-site.xml.patch

# patch for node-manager
patch bootstrap/hadoop-service/hadoop-configuration/nodemanager-mapred-site.xml config-patch/nodemanager-mapred-site.xml.patch
patch bootstrap/hadoop-service/hadoop-configuration/nodemanager-yarn-site.xml config-patch/nodemanager-yarn-site.xml.patch

# patch for resource-manager
patch bootstrap/hadoop-service/hadoop-configuration/resourcemanager-mapred-site.xml config-patch/resourcemanager-mapred-site.xml.patch
patch bootstrap/hadoop-service/hadoop-configuration/resourcemanager-yarn-site.xml config-patch/resourcemanager-yarn-site.xml.patch

rm -rf hadoop