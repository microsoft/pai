#!/usr/bin/env python

import copy

class StorageManager(object):
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
        security_type = conf["storage-manager"].get("security-type")

        if security_type != "AUTO" and security_type != "ADS":
            msg = "expect security_type in storage-manager to be AUTO or ADS but get %s" % \
                    (security_type)
            return False, msg
        return True, None
