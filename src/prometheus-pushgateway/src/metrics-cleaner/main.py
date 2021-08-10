from datetime import timezone, datetime, timedelta
import os
import logging
import time
import requests
import pytz


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


def getPushgatewayJobsToDelete(pushgateway_uri, seconds):
    """
    Jobs have not been updated within the given seconds should be deleted

    Returns:
    --------
    list of job names
    """
    resp = requests.get("{}/prometheus-pushgateway/api/v1/metrics".format(pushgateway_uri))
    resp.raise_for_status()

    job_names = []
    for job in resp.json()["data"]:
        # get job name
        if "labels" not in job or "job" not in job["labels"]:
            continue
        job_name = job["labels"]["job"]

        # get last pushed time
        if "push_time_seconds" not in job or "time_stamp" not in job["push_time_seconds"]:
            continue
        last_pushed_time = job["push_time_seconds"]["time_stamp"]
        
        # if the job has been updated within the interval, ignore it
        last_pushed_time = datetime.strptime(last_pushed_time.split(".")[0], '%Y-%m-%dT%H:%M:%S').replace(tzinfo=pytz.UTC)
        if last_pushed_time > datetime.now(timezone.utc) - timedelta(seconds=seconds):
            continue

        job_names.append(job_name)

    return job_names


@enable_request_debug_log
def cleanPushgatewayJobs():
    PROMETHEUS_PUSHGATEWAY_URI = os.environ.get('PROMETHEUS_PUSHGATEWAY_URI')
    JOB_TIME_TO_LIVE = int(os.environ.get('JOB_TIME_TO_LIVE'))

    logging.info("Getting Pushgateway jobs to delete...")
    job_names = getPushgatewayJobsToDelete(PROMETHEUS_PUSHGATEWAY_URI, JOB_TIME_TO_LIVE)
    logging.info("Pushgateway jobs to delete: %s", job_names)

    # delete related metrics from Prometheus Pushgateway by job
    for job_name in job_names:
        url = "{}/prometheus-pushgateway/metrics/job/{}".format(PROMETHEUS_PUSHGATEWAY_URI, job_name)
        requests.delete(url)


if __name__ == "__main__":
    logging.basicConfig(
        format=
        "%(asctime)s - %(levelname)s - %(filename)s:%(lineno)s - %(message)s",
        level=logging.INFO,
    )

    CLEAN_INTERVAL = int(os.environ.get('CLEAN_INTERVAL'))
    while True:
        cleanPushgatewayJobs()
        time.sleep(CLEAN_INTERVAL)
