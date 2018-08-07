FROM openpai/hadoop-run

WORKDIR /spark-example

# TODO need to figure out how to generate config from PAI
COPY yarn/etc yarn/etc/
ENV HADOOP_CONF_DIR /spark-example/yarn/etc

# install spark
ADD http://www-us.apache.org/dist/spark/spark-2.3.1/spark-2.3.1-bin-hadoop2.7.tgz /spark-example
RUN tar -zxvf spark-2.3.1-bin-hadoop2.7.tgz
RUN rm spark-2.3.1-bin-hadoop2.7.tgz

# setup env
ENV SPARK_HOME /spark-example/spark-2.3.1-bin-hadoop2.7
ENV PATH=${SPARK_HOME}/bin:$PATH

# Fix "Exception in thread "main" java.lang.NoClassDefFoundError: com/sun/jersey/api/client/config/ClientConfig"
RUN rm spark-2.3.1-bin-hadoop2.7/jars/jersey-client-2.22.2.jar
COPY jersey-core-1.9.jar jersey-client-1.9.jar spark-2.3.1-bin-hadoop2.7/jars/

COPY submit_pi.sh .
RUN chmod +x submit_pi.sh


