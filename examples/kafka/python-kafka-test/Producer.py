from kafka import KafkaProducer
import json

producer = KafkaProducer(bootstrap_servers=host, value_serializer=lambda v: json.dumps(v).encode('utf-8'), acks='all')
for i in range(100):
    producer.send('test', {i:'The new ' + str(i) + 'th number'})
producer.flush()
