from datetime import timezone, datetime, timedelta
import os
import logging
import urllib.parse
import requests

REST_JOB_API_PREFIX = "/rest-server/api/v2/jobs?order=completionTime,DESC"

PAI_URI = os.environ.get("PAI_URI")
MASTER_IP = "10.151.40.234"
PORT = "9097"
TOKEN = os.environ.get('PAI_BEARER_TOKEN')

def check_timestamp_within_7d(timestamp):
    """
    check if a timestamp is within 7 days
    """
    return datetime.fromtimestamp(int(timestamp/1000), timezone.utc) > datetime.now(timezone.utc) - timedelta(days=7)


def get_related_jobs(rest_url):
    """
    Returns all related jobs

    Returns:
    --------
    list
        All the jobs completed within 7 days will be included in the list.
        Jobs completed before 7 days may also be included.
        The list may contain duplicated jobs.
    """
    jobs_related = []

    offset = 0
    limit = 5000
    headers = {'Authorization': "Bearer {}".format(TOKEN)}
    while True:
        resp = requests.get(rest_url+"limit={}&offset={}".format(limit, offset), headers=headers)
        resp.raise_for_status()
        jobs = resp.json()
        jobs_related += jobs
        # no more jobs or the last job in the list completed before 7 days
        if not jobs or (jobs[-1]["completedTime"] is not None and not check_timestamp_within_7d(jobs[-1]["completedTime"])) :
            break
        offset += limit

    return jobs_related


def main():
    rest_url = urllib.parse.urljoin(PAI_URI, REST_JOB_API_PREFIX)
    # get jobs that finished within 7 days (should be >= the cleaning interval)
    jobs = get_related_jobs(rest_url)

    print("PAI_URI: ", os.environ.get("PAI_URI"))
    print("PAI_URI_HTTP: ", os.environ.get("PAI_URI_HTTP"))
    # delete related metrics from Pushgateway
    for job in jobs:
        # TODO: use https url after pylon get configured
        url = "http://{}:{}/prometheus-pushgateway/metrics/job/{}".format(MASTER_IP, PORT, job.name)
        requests.delete(url)

if __name__ == "__main__":
    logging.basicConfig(
        format=
        "%(asctime)s - %(levelname)s - %(filename)s:%(lineno)s - %(message)s",
        level=logging.INFO,
    )
    main()
