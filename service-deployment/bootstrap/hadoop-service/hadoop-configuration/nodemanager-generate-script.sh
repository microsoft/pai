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

cp  /hadoop-configuration/nodemanager-mapred-site.xml $HADOOP_CONF_DIR/mapred-site.xml
cp  /hadoop-configuration/nodemanager-yarn-site.xml $HADOOP_CONF_DIR/yarn-site.xml

# Step 4(2) of 4 to set up Hadoop queues.
# Copy the capacity-scheduler.xml from configmap to the hadoop configuration folder.
# Three sub-steps:
#   1) Extract the head part from the original capacity-scheduler.xml file (a.k.a. the target file).
#   2) Extract the 'configuration' part from the capacity-scheduler.xml in the configmap (a.k.a. the content file).
#   3) Concatent the above two parts and use it to replace the original capacity-scheduler.xml file.
# Do the same for resourcemanager and jobhistory.
TARGET_FILE=$HADOOP_CONF_DIR/capacity-scheduler.xml
CONTENT_FILE=/hadoop-configuration/capacity-scheduler.xml.content
sed -n 1,$((`grep -n "<configuration>" $TARGET_FILE | cut -d: -f 1` - 1))p $TARGET_FILE > tmp
sed -n $((`grep -n "<configuration>" $CONTENT_FILE | cut -d: -f 1`)),$((`wc -l < $CONTENT_FILE`))p $CONTENT_FILE >> tmp
cp -f tmp $TARGET_FILE

HOST_NAME=`hostname`
/usr/local/host-configure.py -c /host-configuration/host-configuration.yaml -f $HADOOP_CONF_DIR/yarn-site.xml  -n $HOST_NAME

sed  -i "s/{RESOURCEMANAGER_ADDRESS}/${RESOURCEMANAGER_ADDRESS}/g" $HADOOP_CONF_DIR/yarn-site.xml
sed  -i "s/{ZOOKEEPER_ADDRESS}/${ZOOKEEPER_ADDRESS}/g" $HADOOP_CONF_DIR/yarn-site.xml 
sed  -i "s/{HDFS_ADDRESS}/${HDFS_ADDRESS}/g" $HADOOP_CONF_DIR/yarn-site.xml 
sed  -i "s/{LOGSERVER_ADDRESS}/${LOGSERVER_ADDRESS}/g" $HADOOP_CONF_DIR/yarn-site.xml 

sed  -i "s/{HDFS_ADDRESS}/${HDFS_ADDRESS}/g" $HADOOP_CONF_DIR/core-site.xml 

sed  -i "s/{LOGSERVER_ADDRESS}/${LOGSERVER_ADDRESS}/g" $HADOOP_CONF_DIR/mapred-site.xml 

