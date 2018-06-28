from kafka import KafkaConsumer
from hdfs.client import Client
import time

path = outdir.split('/')
hdfs_host = 'http://' + path[2].split(':')[0] + ':50070'
file_path = '/' + '/'.join(path[3:])
client = Client(hdfs_host)
print(hdfs_host)
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
client.upload(file_path,'output.log')
