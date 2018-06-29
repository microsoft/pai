from kafka import KafkaProducer
import argparse
import json

parser = argparse.ArgumentParser()
parser.add_argument('--host', type=str, default=None)
args = parser.parse_args()
producer = KafkaProducer(bootstrap_servers=args.host, value_serializer=lambda v: json.dumps(v).encode('utf-8'), acks='all')
for i in range(100):
    producer.send('test', {i:'The new ' + str(i) + 'th number'})
producer.flush()
