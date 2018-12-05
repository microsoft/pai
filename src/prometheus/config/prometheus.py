#!/usr/bin/env python

import copy

class Prometheus(object):
    def __init__(self, cluster_conf, service_conf, default_service_conf):
        self.cluster_conf = cluster_conf
        self.service_conf = service_conf
        self.default_service_conf = default_service_conf

    def get_master_ip(self):
        for host_conf in self.cluster_conf["machine-list"]:
            if "pai-master" in host_conf and host_conf["pai-master"] == "true":
                return host_conf["hostip"]

    def validation_pre(self):
        return True, None

    def run(self):
        result = copy.deepcopy(self.default_service_conf)
        result.update(self.service_conf)
        result["url"] = "http://{0}:{1}".format(self.get_master_ip(), result["port"])
        return result

    def validation_post(self, conf):
        error_msg ="expect %s in prometheus to be int but get %s with type %s"

        port = conf["prometheus"].get("port")
        if type(port) != int:
            return False, error_msg % ("port", port, type(port))

        interval = conf["prometheus"].get("scrape_interval")
        if type(interval) != int:
            return False, error_msg % ("interval", interval, type(interval))


        return True, None
