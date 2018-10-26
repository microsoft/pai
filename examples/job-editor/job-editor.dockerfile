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
  mv hadoop-3.0.3 /usr/local/hadoop
# config hadoop
RUN echo 'export JAVA_HOME=$(readlink -f /usr/bin/java | sed "s:bin/java::") \n\
export HADOOP_HOME=/usr/local/hadoop \n\
' >> /usr/local/hadoop/etc/hadoop/hadoop-env.sh
# solve error in pydoop installation: 'pydoop.LocalModeNotSupported: ERROR: Hadoop is configured to run in local mode'
RUN echo '<configuration><property><name>mapreduce.framework.name</name><value>yarn</value></property></configuration>' > /usr/local/hadoop/etc/hadoop/mapred-site.xml

# install pydoop for python 3
# https://github.com/crs4/pydoop/issues/230
RUN . /usr/local/hadoop/etc/hadoop/hadoop-env.sh && \
  pip install --pre pydoop

# install hdfscontents
RUN pip install hdfscontents

USER $NB_UID

