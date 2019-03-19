# Build customize Kafka docker

Please follow the next processes step by step. Do not skip any steps if you don't know whether you can skip them.

### Zookeeper

If you already have a kafka cluster, you could skip this step. And if you build the image by "Dockerfile.example.kafka", you should do the work of step 2 and ignore the others.

1. [Download zookeeper source file](https://zookeeper.apache.org/doc/r3.1.2/zookeeperStarted.html) and unpack it.

2. Change the name of file "/conf/zoo_sample.cfg" to "/conf/zoo.cfg" and open it.

3. Set the "dataDir" and "clientPort" like "dataDir=/var/zookeeper clientPort=XXXX". Remember the port you set.

4. Start it `bin/zkServer.sh start`.

### Kafka

If you already have a kafka cluster or build the image by "Dockerfile.example.kafka", you could skip this step.

Just take reference in the [official document](https://www.tutorialspoint.com/apache_kafka/apache_kafka_installation_steps.html).

Note:

1. You should set the listeners in config/server.properties:"listeners=PLAINTEXT://localhost:XXXX". The port "XXXX" is the kafka client port you should use in your client code. But you'd better use dynamic port rather than static port due to possible conflict. The way of using dynamic port is described at the end of this document.

2. The "zookeeper.connect" port is the port you have already set in "/conf/zoo.cfg".

3. If you can't start the kafka server, it might because you haven't started the zookeeper server or you haven't set the correct port.

### Make your logical code

1. If you want to use python to check if the kafka can be used correctly, you'd better see the [official document](https://kafka-python.readthedocs.io/en/master/). Don't forget to install kafka-python.(If you build the image by "Dockerfile.example.kafka", ignore it!)

2. When you use the producer of kafka, you should keep in mind that the massage might be lost if you haven't set "acks" and haven't use "producer.flush()".

3. When you use the consumer of kafka, you should notice that you might be not able to consumer the message if you don't set "auto_offset_reset" to "earliest" even though you produce the message after you starting the consumer.

4. Make a shell file to start all the servers and programs.