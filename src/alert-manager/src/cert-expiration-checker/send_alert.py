from datetime import timezone, datetime, timedelta
import logging
import os
import requests
import ssl
from OpenSSL import crypto

ALERT_PREFIX = "/alert-manager/api/v1/alerts"
APISERVER_CERT_PATH = '/etc/kubernetes/ssl/apiserver.crt'
alertResidualDays = int(os.environ.get('ALERT_RESIDUAL_DAYS'))

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
def send_alert(pai_url: str, residualTime: int, certExpirationInfo: str):
    trigger_time = str(datetime.now(timezone.utc).date())
    post_url = pai_url.rstrip("/") + ALERT_PREFIX
    alerts = []
    alert = {
        "labels": {
            "alertname": "k8s cert expiration",
            "severity": "warn",
            "trigger_time": trigger_time,
        },
        "annotations": {
            "summary": f"The k8s cert will be expired in {residualTime} days.",
            "message": f"{certExpirationInfo}",
        },
        "generatorURL": "alert/script",
    }
    alerts.append(alert)
    print(alerts)
    logging.info("Sending alerts to alert-manager...")
    resp = requests.post(post_url, json=alerts)
    resp.raise_for_status()
    logging.info("Alerts sent to alert-manager.")

def main():
    PAI_URI = os.environ.get("PAI_URI")
    certfile = open(APISERVER_CERT_PATH).read()
    cert = crypto.load_certificate(crypto.FILETYPE_PEM, certfile)
    expirationTime = datetime.strptime(cert.get_notAfter().decode('ascii'), r'%Y%m%d%H%M%SZ')
    delta = expirationTime - datetime.now()
    if (delta < timedelta(days = alertResidualDays)):
        send_alert(PAI_URI, delta.days, f'Not after {expirationTime}')

if __name__ == "__main__":
    logging.basicConfig(
        format=
        "%(asctime)s - %(levelname)s - %(filename)s:%(lineno)s - %(message)s",
        level=logging.INFO,
    )
    main()
