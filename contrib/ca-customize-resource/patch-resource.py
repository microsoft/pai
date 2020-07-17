from __future__ import print_function
import json
from kubernetes import client, config
from kubernetes.client.rest import ApiException
from pprint import pprint

config.load_kube_config()
api_instance = client.CoreV1Api()
name = "k8s-opworker-30604766-vmss000000"
body = client.UNKNOWN_BASE_TYPE() # UNKNOWN_BASE_TYPE |
pretty = "true"
force = True
with open('resouce-add.json') as resource_update_list:
    body = json.load(resource_update_list)
try:
    api_response = api_instance.patch_node_status(name, body, pretty=pretty, force=force)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling CoreV1Api->patch_node_status: %s\n" % e)