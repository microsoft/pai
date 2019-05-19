import requests
import logging
import sys

logger = logging.getLogger(__name__)


class AlertOperator(object):
    ALERT_TYPE = {
        "gpu_related": {"NvidiaSmiLatencyTooLarge", "NvidiaSmiEccError", "NvidiaMemoryLeak", "NvidiaZombieProcess", "GpuUsedByExternalProcess", "GpuUsedByZombieContainer"},
    }

    def __init__(self, prometheus_ip, prometheus_port=9091):
        self.master_ip = prometheus_ip
        self.master_port = prometheus_port
        self.alert_manager_url = "http://{}:{}/prometheus/api/v1/query?query=ALERTS".format(prometheus_ip, prometheus_port)

    def get_gpu_alert_nodes(self):
        try:
            response = requests.get(self.alert_manager_url, timeout=10)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            logger.exception(e)
            sys.exit(1)

        if response.json()["status"] != "success":
            logger.error("Alert response error: {}".format(response.text))
            sys.exit(1)

        alerts_info = response.json()["data"]["result"]
        gpu_alert_nodes = {}
        for alert in alerts_info:
            metric = alert["metric"]
            if metric["alertname"] in self.ALERT_TYPE["gpu_related"] and metric["alertstate"] == "firing":
                node_ip = metric["instance"].split(':')[0]
                gpu_alert_nodes[node_ip] = metric["alertname"]

        return gpu_alert_nodes