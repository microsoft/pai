from kubernetes import client, config

class KubeCollector:
    def __init__(self):
        config.load_incluster_config()
        pass

    def check_health(self):
        v1 = client.CoreV1Api()
        v1.list_pod_for_all_namespaces()
        pass
