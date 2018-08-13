FROM openpai/hadoop-run

# remove python2, pip
RUN apt-get remove python python-pip -y
RUN apt-get autoremove -y
# install pip3
RUN curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
RUN python3 get-pip.py

WORKDIR /spark-example

# Yarn config mounted on /etc/hadoop
ENV HADOOP_CONF_DIR /etc/hadoop

# install spark
ADD http://www-us.apache.org/dist/spark/spark-2.3.1/spark-2.3.1-bin-hadoop2.7.tgz /spark-example
RUN tar -zxvf spark-2.3.1-bin-hadoop2.7.tgz
RUN rm spark-2.3.1-bin-hadoop2.7.tgz

# setup env
ENV SPARK_HOME /spark-example/spark-2.3.1-bin-hadoop2.7
ENV PATH=${SPARK_HOME}/bin:${SPARK_HOME}/sbin:$PATH

# Fix "Exception in thread "main" java.lang.NoClassDefFoundError: com/sun/jersey/api/client/config/ClientConfig"
RUN rm spark-2.3.1-bin-hadoop2.7/jars/jersey-client-2.22.2.jar
ADD http://central.maven.org/maven2/com/sun/jersey/jersey-client/1.9.1/jersey-client-1.9.1.jar spark-2.3.1-bin-hadoop2.7/jars/
ADD http://central.maven.org/maven2/com/sun/jersey/jersey-core/1.9.1/jersey-core-1.9.1.jar spark-2.3.1-bin-hadoop2.7/jars/

