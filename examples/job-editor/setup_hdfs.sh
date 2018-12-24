#!/bin/bash
source ${HADOOP_HOME}/etc/hadoop/hadoop-env.sh
echo "<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<configuration>
  <property>
   <name>fs.default.name</name>
   <value>${HDFS_FS_DEFAULT}</value>
   <description>.</description>
  </property>
</configuration>
" > ${HADOOP_HOME}/etc/hadoop/core-site.xml

echo "[global]
default.alias = dev

[dev.alias]
url = ${WEBHDFS_FS_DEFAULT}
user = ${PAI_USER_NAME}
" > ~/.hdfscli.cfg

