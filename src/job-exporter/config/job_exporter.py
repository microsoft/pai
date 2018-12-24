#!/usr/bin/env python

import copy

class JobExporter(object):
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
        port = conf["job-exporter"].get("port")
        if type(port) != int:
            msg = "expect port in job-exporter to be int but get %s with type %s" % \
                    (port, type(port))
            return False, msg
        level = conf["job-exporter"].get("logging-level")
        if level not in {"DEBUG", "INFO", "WARNING"}:
            msg = "expect logging-level in job-exporter to be {'DEBUG', 'INFO', 'WARNING'} but got %s" % \
                    (level)
            return False, msg
        return True, None
