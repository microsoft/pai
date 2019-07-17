#!/usr/bin/env python

import copy

class LogManager(object):
    def __init__(self, cluster_conf, service_conf, default_service_conf):
        self.cluster_conf = cluster_conf
        self.service_conf = service_conf
        self.default_service_conf = default_service_conf

    def validation_pre(self):
        return True, None

    def run(self):
        result = copy.deepcopy(self.default_service_conf)
        result.update(self.service_conf)
        return result

    def validation_post(self, conf):
        port = conf["log-manager"].get("port")
        if type(port) != int:
            msg = "expect port in log-manager to be int but get %s with type %s" % \
                    (port, type(port))
            return False, msg
        return True, None
