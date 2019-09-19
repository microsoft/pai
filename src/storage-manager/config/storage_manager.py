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
        smbport = conf["storage-manager"].get("smbport")
        nfsport = conf["storage-manager"].get("nfsport")
        if type(smbport) != int:
            msg = "expect smbport in storage-manager to be int but get %s with type %s" % \
                    (smbport, type(smbport))
            return False, msg
        if type(nfsport) != int:
            msg = "expect nfsport in storage-manager to be int but get %s with type %s" % \
                    (nfsport, type(nfsport))
            return False, msg
        return True, None
