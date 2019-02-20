#!/usr/bin/env python

import copy
import sys
import yaml

labels = {"app": "etcd-server"}

probe = {"httpGet": {"path": "/health", "port": 4001},
         "initialDelaySeconds": 10,
         "periodSeconds": 30,
         "timeoutSeconds": 10}

def add_fields(obj):
    obj = copy.deepcopy(obj)
    assert obj["apiVersion"] == "v1"
    assert obj["kind"] == "Pod"
    assert obj["metadata"]["name"] == "etcd-server"
    obj["metadata"]["labels"] = labels
    obj["spec"]["containers"][0]["readinessProbe"] = probe
    return obj

if __name__ == '__main__':
    print(yaml.dump(add_fields(yaml.load(sys.stdin))))
