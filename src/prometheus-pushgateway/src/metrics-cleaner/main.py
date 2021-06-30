from datetime import timezone, datetime, timedelta
import os
import logging
import urllib.parse
import requests


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


def check_timestamp_within_period(timestamp, days):
    """
    check if a timestamp is within a period

    Parameters:
    -----------
    timestamp:
        the timestamp to check
    days: int
        we use days to specify the period as : from xx days ago to now
    """
    return datetime.fromtimestamp(int(timestamp/1000), timezone.utc) > datetime.now(timezone.utc) - timedelta(days=days)


def get_jobs_completed_within_period(pai_uri, token, days=7):
    """
    Returns the names of all jobs finished within the period

    Returns:
    --------
    list
        The names of all the jobs completed within the period.
    """
    jobs_related = []

    offset = 0
    limit = 500
    headers = {'Authorization': "Bearer {}".format(token)}
    rest_url = urllib.parse.urljoin(pai_uri, "/rest-server/api/v2/jobs?order=completionTime,DESC")
    while True:
        resp = requests.get(rest_url+"&limit={}&offset={}".format(limit, offset), headers=headers)
        resp.raise_for_status()
        jobs = resp.json()

        # no more jobs or the first job in the list completed before the period
        if not jobs or jobs[0]["completedTime"] is None or not check_timestamp_within_period(jobs[0]["completedTime"], days):
            break

        jobs = list(filter(lambda job: job["completedTime"] is not None and check_timestamp_within_period(job["completedTime"], days), jobs))
        jobs_related += [job["name"] for job in jobs]

        if len(jobs) < limit:
            break
        offset += limit

    return jobs_related


@enable_request_debug_log
def main():
    PAI_URI = os.environ.get("PAI_URI")
    TOKEN = os.environ.get('PAI_BEARER_TOKEN')
    PROMETHEUS_PUSHGATEWAY_URI = os.environ.get('PROMETHEUS_PUSHGATEWAY_URI')
    CLEAN_PERIOD = os.environ.get('CLEAN_PERIOD')

    # get jobs that finished within the period
    # the period should be >= the cleaning interval
    job_names = get_jobs_completed_within_period(PAI_URI, TOKEN, CLEAN_PERIOD)

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
    main()
