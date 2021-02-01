import argparse
from datetime import timezone, datetime, timedelta
import logging
import requests
import urllib

CLUSTER_QUERY_STRING = "avg(avg_over_time(nvidiasmi_utilization_gpu[7d]))"
JOB_QUERY_STRING = 'avg by (job_name) (avg_over_time(task_gpu_percent{username!="noves"}[7d]))'
JOB_METRICS_COUNT_QUERY_STRING = 'max by (job_name) (count_over_time(task_gpu_percent{username!="noves"}[7d]))'
# user used gpu hours / total gpu hours
USER_QUERY_STRING = "(sum by (username) (sum_over_time(task_gpu_percent[7d]))) / (sum by (username) (count_over_time(task_gpu_percent[7d])*100)) * 100"
QUERY_PREFIX = "/prometheus/api/v1/query"
ALERT_PREFIX = "/api/v1/alerts"
REST_JOB_API_PREFIX = "/rest-server/api/v2/jobs"
TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImJpbnlsaSIsImFwcGxpY2F0aW9uIjp0cnVlLCJpYXQiOjE2MDU0MjU1NjB9.7-4HOICNJy9DvdDlJEdaNX__bx4mQbtyxSjJO96d910"
# int
TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Imd1c3VpIiwiYXBwbGljYXRpb24iOnRydWUsImlhdCI6MTYxMTkxMzgwMX0.A4ScIsZLsD4TBJ4glganEMDVU01rfEm16Lb0Lwqb-2o"

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
def get_job_usage_info(job_usage_result, job_metrics_count, rest_url):
    job_infos = {}
    job_usage = []
    job_list = []
    # get all jobs
    headers = {'Authorization': TOKEN}
    resp = requests.get(rest_url, headers=headers)
    if resp.ok:
        job_list = resp.json()
    else:
        logging.warning("Failed to get job list")

    for v in job_usage_result["data"]["result"]:
        job_infos[v["metric"]["job_name"]] = {"usage": v["value"][1][:6] + "%"}
    for k in job_infos.keys():
        url = urllib.parse.urljoin(rest_url + "/", k)
        headers = {'Authorization': TOKEN}
        resp = requests.get(url, headers=headers)
        if not resp.ok:
            logging.warning("request failed %s", resp.text)
            continue
        resp_json = resp.json()
        if not resp_json["jobStatus"]["appLaunchedTime"]:
            logging.warning("job not start, ignore it")
            continue
        job_infos[k]["start_time"] = datetime.fromtimestamp(
            int(resp_json["jobStatus"]["appLaunchedTime"]) / 1000,
            timezone.utc)
        if not resp_json["jobStatus"]["appLaunchedTime"] or not resp_json[
                "jobStatus"]["appCompletedTime"]:
            job_infos[k]["duration"] = datetime.now(
                timezone.utc) - job_infos[k]["start_time"]
        else:
            job_infos[k]["duration"] = datetime.fromtimestamp(
                int(resp_json["jobStatus"]["appCompletedTime"]) / 1000,
                timezone.utc) - job_infos[k]["start_time"]
        job_infos[k]["status"] = resp_json["jobStatus"]["state"]
        matched_job = list(
            filter(
                lambda job: "{}~{}".format(job["username"], job["name"]) == k,
                job_list))
        if matched_job:
            job_infos[k]["gpu_number"] = matched_job[0]["totalGpuNumber"]
        else:
            job_infos[k]["gpu_number"] = 0
    for k, v in job_infos.items():
        if "start_time" not in v:
            continue
        job_usage.append(
            (k, v["usage"], str(v["duration"]),
             v["start_time"].strftime("%y-%m-%d %H:%M:%S"), v["status"],
             str(v["gpu_number"])))
    return job_usage


@enable_request_debug_log
def collect_metrics(url):
    logging.info("Start to collect usage info")
    query_url = url.rstrip("/") + QUERY_PREFIX
    rest_url = url.rstrip("/") + REST_JOB_API_PREFIX

    # cluster info
    resp = requests.get(query_url, params={"query": CLUSTER_QUERY_STRING})
    if not resp.ok:
        resp.raise_for_status()
    result = resp.json()
    cluster_usage = result["data"]["result"][0]["value"][1][:6] + "%"

    # user info
    logging.info("Start to getting user average usage")
    resp = requests.get(query_url, params={"query": USER_QUERY_STRING})
    if not resp.ok:
        resp.raise_for_status()
    result = resp.json()
    user_usage = []
    for v in result["data"]["result"]:
        user_usage.append((v["metric"]["username"], v["value"][1][:6] + "%"))

    # job info
    logging.info("Start to getting job usage")
    resp = requests.get(query_url, params={"query": JOB_QUERY_STRING})
    resp_count = requests.get(query_url,
                              params={"query": JOB_METRICS_COUNT_QUERY_STRING})
    if not resp.ok:
        resp.raise_for_status()
    if not resp_count.ok:
        resp_count.raise_for_status()
    result = resp.json()
    result_count = resp_count.json()
    job_usage = get_job_usage_info(result, result_count, rest_url)

    return cluster_usage, job_usage, user_usage


@enable_request_debug_log
def send_alert(url: str, cluster_usage, job_usage, user_usage):
    trigger_time = str(datetime.now(timezone.utc).date())
    logging.info("Starting to send alerts")
    post_url = url.rstrip("/") + ALERT_PREFIX
    # for cluster
    payload = [{
        "labels": {
            "alertname": "usage",
            "report_type": "cluster-usage",
            "cluster_usage": cluster_usage,
            "trigger_time": trigger_time,
        },
        "generatorURL": "alert/script"
    }]
    resp = requests.post(post_url, json=payload)
    if not resp.ok:
        resp.raise_for_status()

    # for job
    for job in job_usage:
        payload = [{
            "labels": {
                "alertname": "usage",
                "report_type": "cluster-usage",
                "job_name": job[0],
                "job_usage": job[1],
                "job_duration": job[2],
                "job_start_time": job[3],
                "job_status": job[4],
                "job_gpu_number": job[5],
                "trigger_time": trigger_time,
            },
            "generatorURL": "alert/script"
        }]
        resp = requests.post(post_url, json=payload)
        if not resp.ok:
            resp.raise_for_status()

    # for user
    for user in user_usage:
        payload = [{
            "labels": {
                "alertname": "usage",
                "report_type": "cluster-usage",
                "user_name": user[0],
                "user_usage": user[1],
                "trigger_time": trigger_time,
            },
            "generatorURL": "alert/script"
        }]
        resp = requests.post(post_url, json=payload)
        if not resp.ok:
            resp.raise_for_status()
    logging.info("Finished sending alerts")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("pai_url", help="pai url")
    parser.add_argument("alert_manager_url", help="alert manager url")
    args = parser.parse_args()
    cluster_usage, job_usage, user_usage = collect_metrics(args.pai_url)
    send_alert(args.alert_manager_url, cluster_usage, job_usage, user_usage)


if __name__ == "__main__":
    logging.basicConfig(
        format=
        "%(asctime)s - %(levelname)s - %(filename)s:%(lineno)s - %(message)s",
        level=logging.INFO,
    )
    main()
