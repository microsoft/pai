FROM jupyter/minimal-notebook

USER root

# install java
RUN apt-get update \
  && apt-get install default-jdk -y \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# install hadoop
RUN wget http://www-us.apache.org/dist/hadoop/common/hadoop-3.0.3/hadoop-3.0.3.tar.gz && \
  tar -xzvf hadoop-3.0.3.tar.gz && \
  mv hadoop-3.0.3 /usr/local/hadoop && \
  rm hadoop-3.0.3.tar.gz
# config hadoop
RUN echo 'export JAVA_HOME=$(readlink -f /usr/bin/java | sed "s:bin/java::") \n\
export HADOOP_HOME=/usr/local/hadoop \n\
' >> /usr/local/hadoop/etc/hadoop/hadoop-env.sh
# solve error in pydoop installation: 'pydoop.LocalModeNotSupported: ERROR: Hadoop is configured to run in local mode'
RUN echo '<configuration><property><name>mapreduce.framework.name</name><value>yarn</value></property></configuration>' > /usr/local/hadoop/etc/hadoop/mapred-site.xml

# install hdfscli
RUN pip install hdfs

# hdfs setup script
COPY setup_hdfs.sh /root/setup_hdfs.sh

ENV JUPYTER_ENABLE_LAB true
ENV GRANT_SUDO yes
ENV HADOOP_HOME /usr/local/hadoop
ENV JAVA_HOME /usr/lib/jvm/java-11-openjdk-amd64/
ENV JUPYTER_HOST_IP 0.0.0.0

# mnist example
COPY mnist_pytorch.ipynb work
RUN fix-permissions $HOME

# user will need to passing ENVs below to container:
#PAI_URL
#PAI_USER_NAME
#PAI_CONTAINER_HOST_jupyter_PORT_LIST
#HDFS_FS_DEFAULT(optional)
#WEBHDFS_FS_DEFAULT(optional)
CMD ["bash", "-c", "/root/setup_hdfs.sh && start-notebook.sh --ip $JUPYTER_HOST_IP --port=$PAI_CONTAINER_HOST_jupyter_PORT_LIST --NotebookApp.token=\"\""]

