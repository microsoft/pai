class WorkerNode(object):
    
    def __init__(self):
        self.k8s_name = None
        self.k8s_is_ready = False
        self.k8s_pod_num = 0
        self.vc = None


class WorkerNodeDict(dict):

    def __getitem__(self, idx):
        self.setdefault(idx, WorkerNode())
        return super().__getitem__(idx)
    
    def get_available_nodes(self):
        return [node.k8s_name for node in self.values() if node.k8s_is_ready]
    
    def get_free_nodes(self):
        return [node.k8s_name for node in self.values() if node.k8s_is_ready and node.k8s_pod_num == 0]
    
    def get_deallocated_nodes(self):
        return [node.k8s_name for node in self.values() if not node.k8s_is_ready]
    
    def get_has_pod_nodes(self):
        return [node.k8s_name for node in self.values() if nodes.k8s_pod_num > 0]
