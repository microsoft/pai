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

ip_list=`ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*'`

host_ip_address=''

for ip_address in $ip_list
do
    if cat /host-configuration/host-configuration.yaml | grep -q $ip_address;
    then
       host_ip_address=$ip_address
       break
    fi
done

echo "The ip-address of this machine is: $host_ip_address"

echo "$host_ip_address  $host_ip_address" >> /etc/hosts


cp  /hadoop-configuration/core-site.xml $HADOOP_CONF_DIR/core-site.xml
cp  /hadoop-configuration/mapred-site.xml $HADOOP_CONF_DIR/mapred-site.xml
cp  /hadoop-configuration/yarn-site.xml $HADOOP_CONF_DIR/yarn-site.xml
cp  /hadoop-configuration/hadoop-env.sh $HADOOP_CONF_DIR/hadoop-env.sh
cp  /hadoop-configuration/yarn-env.sh $HADOOP_CONF_DIR/yarn-env.sh

HOST_NAME=`hostname`
/usr/local/host-configure.py -c /host-configuration/host-configuration.yaml -f $HADOOP_CONF_DIR/yarn-site.xml  -n $HOST_NAME

sed  -i "s/{RESOURCEMANAGER_ADDRESS}/${RESOURCEMANAGER_ADDRESS}/g" $HADOOP_CONF_DIR/yarn-site.xml
sed  -i "s/{ZOOKEEPER_ADDRESS}/${ZOOKEEPER_ADDRESS}/g" $HADOOP_CONF_DIR/yarn-site.xml
sed  -i "s/{HDFS_ADDRESS}/${HDFS_ADDRESS}/g" $HADOOP_CONF_DIR/yarn-site.xml
sed  -i "s/{LOGSERVER_ADDRESS}/${LOGSERVER_ADDRESS}/g" $HADOOP_CONF_DIR/yarn-site.xml
sed  -i "s/{TIMELINE_SERVER_ADDRESS}/${TIMELINE_SERVER_ADDRESS}/g" $HADOOP_CONF_DIR/yarn-site.xml
sed  -i "s#{HOST_YARN_NODEMANAGER_STORAGE}#${HOST_YARN_NODEMANAGER_STORAGE}#g" $HADOOP_CONF_DIR/yarn-site.xml
sed  -i "s#{HOST_HADOOP_TMP_STORAGE}#${HOST_HADOOP_TMP_STORAGE}#g" $HADOOP_CONF_DIR/yarn-site.xml
sed  -i "s#{CURRENT_IMAGE_NAME}#${CURRENT_IMAGE_NAME}#g" $HADOOP_CONF_DIR/yarn-site.xml

sed  -i "s/{HDFS_ADDRESS}/${HDFS_ADDRESS}/g" $HADOOP_CONF_DIR/core-site.xml

sed  -i "s/{LOGSERVER_ADDRESS}/${LOGSERVER_ADDRESS}/g" $HADOOP_CONF_DIR/mapred-site.xml

# set memory and cpu resource for nodemanager
mem_total=`cat /proc/meminfo | grep "MemTotal" | awk '{print $2}'`
# memory size to nodemanager is (mem_total - mem_reserved)
if [ $(grep 'ip:' /host-configuration/host-configuration.yaml|wc -l) -gt 1 ]
then
    echo "Node role is 'Worker'. Reserve 12G for os and k8s."
    let mem_reserved=12*1024
else
    echo "Node role is 'Master & Worker'. Reserve 40G for os and k8s."
    let mem_reserved=40*1024
fi
let mem_total=(mem_total/1024/1024*1024)-mem_reserved
sed  -i "s/{mem_total}/${mem_total}/g" $HADOOP_CONF_DIR/yarn-site.xml

cpu_vcores=`cat /proc/cpuinfo | grep "processor" | wc -l`
sed  -i "s/{cpu_vcores}/${cpu_vcores}/g" $HADOOP_CONF_DIR/yarn-site.xml

# Backup hadoop configuration for job (Spark) use
cp $HADOOP_CONF_DIR/* /hadoop-configuration-for-jobs/

