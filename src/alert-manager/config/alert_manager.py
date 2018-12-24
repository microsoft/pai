#!/usr/bin/env python

import copy

class AlertManager(object):
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
        if result.get("receiver") is not None and \
                result.get("smtp_url") is not None and \
                result.get("smtp_from") is not None and \
                result.get("smtp_auth_username") is not None and \
                result.get("smtp_auth_password") is not None:
            result["configured"] = True
        else:
            result["configured"] = False
        result["host"] = self.get_master_ip()
        result["url"] = "http://{0}:{1}".format(self.get_master_ip(), result["port"])

        return result

    def validation_post(self, conf):
        port = conf["alert-manager"].get("port")
        if type(port) != int:
            msg = "expect port in alert-manager to be int but get %s with type %s" % \
                    (port, type(port))
            return False, msg
        return True, None
