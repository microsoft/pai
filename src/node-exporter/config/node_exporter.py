#!/usr/bin/env python

import copy

class NodeExporter(object):
    def __init__(self, cluster_conf, service_conf, default_service_conf):
        self.cluster_conf = cluster_conf
        self.service_conf = service_conf
        self.default_service_conf = default_service_conf

    def validation_pre(self):
        print("cluster_config is %s, service_config is %s, default is %s" % \
                (self.cluster_conf, self.service_conf, self.default_service_conf))
        return True, None

    def run(self):
        result = copy.deepcopy(self.default_service_conf)
        result.update(self.service_conf)
        return result

    def validation_post(self, conf):
        port = conf["node-exporter"].get("port")
        if type(port) != int:
            msg = "expect port in node-exporter to be int but get %s with type %s" % \
                    (port, type(port))
            return False, msg
        return True, None
