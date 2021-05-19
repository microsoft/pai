class WorkerNode(object):
    
    def __init__(self, ip, k8s_name, k8s_is_ready):
        self.ip = ip
        self.k8s_name = k8s_name
        self.k8s_is_ready = k8s_is_ready

        self.k8s_pod_num = 0
        self.vc = None

        self.to_turn_on = False
        self.to_turn_off = False


class Pod(object):
    
    def __init__(self, vc, host_ip, pending):
        self.vc = vc
        self.host_ip = host_ip
        self.pending = pending


class VirtualCluster(object):

    def __init__(self, name, is_full, is_guaranteed):
        self.name = name
        self.is_full = is_full
        self.is_guaranteed = is_guaranteed
