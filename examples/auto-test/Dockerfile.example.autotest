FROM pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04

#install hdfs client
#download jdk
RUN wget --no-check-certificate --no-cookies --header "Cookie: oraclelicense=accept-securebackup-cookie" http://download.oracle.com/otn-pub/java/jdk/8u181-b13/96a7b8442fe848ef90c96a2fad6ed6d1/jdk-8u181-linux-x64.tar.gz && tar xvf jdk-8u181-linux-x64.tar.gz && rm jdk-8u181-linux-x64.tar.gz

#download hadoop
RUN wget http://archive.apache.org/dist/hadoop/core/hadoop-3.1.1/hadoop-3.1.1.tar.gz && tar zxvf hadoop-3.1.1.tar.gz && rm hadoop-3.1.1.tar.gz

RUN nowabspath=`pwd`

#set hadoop env
ENV HADOOP_HOME=$nowabspath/hadoop-3.1.1 \
    HADOOP_BIN_HOME=$HADOOP_HOME/bin \
    HADOOP_SBIN_HOME=$HADOOP_HOME/sbin \
    HADOOP_COMMON_HOME=$HADOOP_HOME \
    HADOOP_HDFS_HOME=$HADOOP_HOME \
    PATH=$HADOOP_HOME/bin:$PATH \
    HADOOP_CONF_DIR=$HADOOP_HOME/etc/hadoop

#set java env
ENV JAVA_HOME=$nowabspath/jdk1.8.0_181 \
    JAVA_BIN=$JAVA_HOME/bin \
    JAVA_LIB=$JAVA_HOME/lib \
    CLASS_PATH=.:$JAVA_LIB/tools.jar:$JAVA_LIB/dt.jar \
    PATH=$JAVA_HOME:$PATH \
    LD_LIBRARY_PATH=$JAVA_HOME/jre/lib/amd64/server

#install git
RUN apt-get update -y && apt-get upgrade -y && apt-get install -y git

#install python packages
RUN pip3 install json5 hdfs

WORKDIR /root
