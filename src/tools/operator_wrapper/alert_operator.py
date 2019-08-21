# Copyright (c) Microsoft Corporation
# All rights reserved.
#
# MIT License
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
# documentation files (the "Software"), to deal in the Software without restriction, including without limitation
# the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
# to permit persons to whom the Software is furnished to do so, subject to the following conditions:
# The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
# BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
# DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import logging
import sys

from .base_operator import BaseOperator

logger = logging.getLogger(__name__)


class AlertOperator(BaseOperator):
    ALERT_TYPE = {
        "gpu_related": {"NvidiaSmiLatencyTooLarge", "NvidiaSmiEccError", "NvidiaMemoryLeak", "NvidiaZombieProcess", "GpuUsedByExternalProcess", "GpuUsedByZombieContainer"},
    }

    def __init__(self, prometheus_ip, prometheus_port=9091):
        super(AlertOperator, self).__init__(prometheus_ip, prometheus_port)

    def get_gpu_alert_nodes(self):
        api_path = "/prometheus/api/v1/query?query=ALERTS"
        alerts_info = self.request(api_path)

        if alerts_info["status"] != "success":
            logger.error("Alert response error: {}".format(alerts_info["data"]))
            sys.exit(1)

        alerts_info = alerts_info["data"]["result"]
        gpu_alert_nodes = {}
        for alert in alerts_info:
            metric = alert["metric"]
            if metric["alertname"] in self.ALERT_TYPE["gpu_related"] and metric["alertstate"] == "firing":
                node_ip = metric["instance"].split(':')[0]
                gpu_alert_nodes[node_ip] = metric["alertname"]

        return gpu_alert_nodes
