#!/usr/bin/env python
import logging


class DshuttleMaster(object):
    def __init__(self, cluster_conf, service_conf, default_service_conf):
        self.cluster_conf = cluster_conf
        self.service_conf = dict(default_service_conf, **service_conf)
        self.logger = logging.getLogger(__name__)

    def validation_pre(self):
        return True, None

    def run(self):
        service_object_model = dict()
        for k in [
            'worker_rpc_port', 'worker_web_port', 'job_worker_rpc_port',
            'job_worker_data_port', 'job_worker_web_port', 'master_rpc_port',
            'master_web_port', 'master_job_rpc_port', 'master_job_web_port'
        ]:
            service_object_model[k] = self.service_conf[k]
        return service_object_model

    def validation_post(self, conf):
        return True, None
