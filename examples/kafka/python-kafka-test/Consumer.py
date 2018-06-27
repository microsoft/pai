from kafka import KafkaConsumer
from hdfs.client import Client
import time

client = Client(hdfs_host)
consumer = KafkaConsumer('test', bootstrap_servers=host, group_id='test_group', auto_offset_reset='earliest')
print 'Consumer start!'
now = time.time()
with open('output.log','a') as p:
    count = 0
    for msg in consumer:
        print(msg.value)
        p.write(msg.value + '\n')
        count += 1
        if count == 50 or time.time()-now > 10:
            break
if 'kafka_test' not in client.list('/'):
    client.makedirs('/kafka_test', permission=777)
if 'output.log' not in client.list('/kafka_test'):
    client.upload('/kafka_test','output.log')
