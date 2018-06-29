#startup zookeeper
cd /root/zookeeper-3.4.12/conf
sed -i "s/^clientPort=[0-9]*$/clientPort=$PAI_CONTAINER_HOST_zookeeper_PORT_LIST/g" zoo.cfg
cd /root/zookeeper-3.4.12/bin
./zkServer.sh start
sleep 5s

#startup kafka
cd /root/kafka_2.11-1.1.0/config
sed -i "s/^zookeeper.connect=localhost:[0-9]*$/zookeeper.connect=localhost:$PAI_CONTAINER_HOST_zookeeper_PORT_LIST/g" server.properties
sed -i "31a listeners=PLAINTEXT://localhost:$PAI_CONTAINER_HOST_kafka_PORT_LIST" server.properties
cd /root/kafka_2.11-1.1.0
service="zookeeper"
while ! ps -ef | grep $service | egrep -v grep >/dev/null
do
    sleep 5s
done
./bin/kafka-server-start.sh config/server.properties 1>/dev/null 2>&1 &
pid=$!
sleep 30s
service="kafka"
while ! ps -ef | grep $service | egrep -v grep >/dev/null
do
    sleep 5s
done

#create topic
#./bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic test
#sleep 5s

#run python example
cd
python /root/python-kafka-test/Producer.py --host=$PAI_CONTAINER_HOST_kafka_PORT_LIST
sleep 5s
python /root/python-kafka-test/Consumer.py --host=$PAI_CONTAINER_HOST_kafka_PORT_LIST
hdfs dfs -put output.log $PAI_OUTPUT_DIR

while true
do
    sleep 100s
done

#delete topic "test"
#cd /root/kafka_2.11-1.1.0
#./bin/kafka-topics.sh --delete --zookeeper localhost:2181 --topic test
#cd

#close zookeeper and kafka
cd /root/zookeeper-3.4.12/bin
./zkServer.sh stop
kill $pid
