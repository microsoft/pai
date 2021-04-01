from datetime import timezone, datetime, timedelta
import logging
import os
import requests

ALERT_PREFIX = "/alert-manager/api/v1/alerts"

def enable_request_debug_log(func):
    def wrapper(*args, **kwargs):
        requests_log = logging.getLogger("urllib3")
        level = requests_log.level
        requests_log.setLevel(logging.DEBUG)
        requests_log.propagate = True

        try:
            return func(*args, **kwargs)
        finally:
            requests_log.setLevel(level)
            requests_log.propagate = False

    return wrapper

@enable_request_debug_log
def send_alert(pai_url: str, certExpirationInfo: str):
    trigger_time = str(datetime.now(timezone.utc).date())
    post_url = pai_url.rstrip("/") + ALERT_PREFIX
    alerts = []
    alert = {
        "labels": {
            "alertname": "k8s cert expiration",
            "severity": "warn",
            "trigger_time": trigger_time,
        },
        "generatorURL": "alert/script",
        "annotations": certExpirationInfo
    }
    alerts.append(alert)

    logging.info("Sending alerts to alert-manager...")
    resp = requests.post(post_url, json=alerts)
    resp.raise_for_status()
    logging.info("Alerts sent to alert-manager.")

def main():
    PAI_URI = os.environ.get("PAI_URI")
    certExpirationInfo = os.popen('kubeadm alpha certs check-expiration --config="/etc/kubernetes/kubeadm-config.yaml"').read()
    residualTimes = certExpirationInfo.split()[12::8]
    willExpire = False
    for residualTime in residualTimes:
        if (int(residualTime[:-1]) < 365):
            send_alert(PAI_URI, certExpirationInfo)

if __name__ == "__main__":
    logging.basicConfig(
        format=
        "%(asctime)s - %(levelname)s - %(filename)s:%(lineno)s - %(message)s",
        level=logging.INFO,
    )
    main()
