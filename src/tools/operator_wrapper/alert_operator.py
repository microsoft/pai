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
        self.master_ip = prometheus_ip
        self.master_port = prometheus_port

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
