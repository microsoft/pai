#!/usr/bin/env python
import logging


class Fluentd(object):
    def __init__(self, cluster_conf, service_conf, default_service_conf):
        self.logger = logging.getLogger(__name__)

    def validation_pre(self):
        return True, None

    def run(self):
        return {}

    def validation_post(self, conf):
        if 'job-history' in conf['cluster']['common'] and conf['cluster']['common']['job-history'] != "false":
            if conf['postgresql']['enable'] is False:
                return False, "You must set postgresql.enable=true to use job history."
        return True, None
