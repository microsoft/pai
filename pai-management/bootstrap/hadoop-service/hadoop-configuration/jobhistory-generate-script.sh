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

cp  /hadoop-configuration/core-site.xml $HADOOP_CONF_DIR/core-site.xml
cp  /hadoop-configuration/jobhistory-mapred-site.xml $HADOOP_CONF_DIR/mapred-site.xml
cp  /hadoop-configuration/jobhistory-yarn-site.xml $HADOOP_CONF_DIR/yarn-site.xml

sed  -i "s/{RESOURCEMANAGER_ADDRESS}/${RESOURCEMANAGER_ADDRESS}/g" $HADOOP_CONF_DIR/yarn-site.xml 
sed  -i "s/{ZOOKEEPER_ADDRESS}/${ZOOKEEPER_ADDRESS}/g" $HADOOP_CONF_DIR/yarn-site.xml 
sed  -i "s/{HDFS_ADDRESS}/${HDFS_ADDRESS}/g" $HADOOP_CONF_DIR/yarn-site.xml 
sed  -i "s/{LOGSERVER_ADDRESS}/${LOGSERVER_ADDRESS}/g" $HADOOP_CONF_DIR/yarn-site.xml
sed  -i "s/{TIMELINE_SERVER_ADDRESS}/${TIMELINE_SERVER_ADDRESS}/g" $HADOOP_CONF_DIR/yarn-site.xml

sed  -i "s/{HDFS_ADDRESS}/${HDFS_ADDRESS}/g" $HADOOP_CONF_DIR/core-site.xml

sed  -i "s/{LOGSERVER_ADDRESS}/${LOGSERVER_ADDRESS}/g" $HADOOP_CONF_DIR/mapred-site.xml 

