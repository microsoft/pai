from kafka import KafkaConsumer
import time

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
