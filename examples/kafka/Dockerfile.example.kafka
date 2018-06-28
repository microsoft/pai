FROM pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04

#install python3
RUN apt-get update && apt-get install python3.4

#install python-kafka(Kafka Python SDK)
RUN pip install kafka-python

WORKDIR /root
#download zookeeper
RUN wget http://ftp.yz.yamagata-u.ac.jp/pub/network/apache/zookeeper/zookeeper-3.4.12/zookeeper-3.4.12.tar.gz && tar xzvf zookeeper-3.4.12.tar.gz && rm -f zookeeper-3.4.12.tar.gz && mv zookeeper-3.4.12/conf/zoo_sample.cfg zookeeper-3.4.12/conf/zoo.cfg

#download kafka
RUN wget http://ftp.riken.jp/net/apache/kafka/1.1.0/kafka_2.11-1.1.0.tgz && tar xzvf kafka_2.11-1.1.0.tgz && rm kafka_2.11-1.1.0.tgz

#download logic code
RUN wget https://raw.githubusercontent.com/Microsoft/pai/master/examples/kafka/start.sh && chmod u+x start.sh && mkdir python-kafka-test && cd python-kafka-test && wget https://raw.githubusercontent.com/Microsoft/pai/master/examples/kafka/python-kafka-test/Producer.py &&  wget https://raw.githubusercontent.com/Microsoft/pai/master/examples/kafka/python-kafka-test/Consumer.py

WORKDIR /root
