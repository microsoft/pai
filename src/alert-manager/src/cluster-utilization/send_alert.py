from datetime import timezone, datetime, timedelta
import logging
import os
import requests

CLUSTER_QUERY_STRING = "avg(avg_over_time(nvidiasmi_utilization_gpu[7d]))"
JOB_QUERY_STRING = 'avg by (job_name) (avg_over_time(task_gpu_percent[7d]))'
# user used gpu hours / total gpu hours
USER_QUERY_STRING = \
    "(sum by (username) (sum_over_time(task_gpu_percent[7d]))) / (sum by (username) (count_over_time(task_gpu_percent[7d])*100)) * 100"

QUERY_PREFIX = "/prometheus/api/v1/query"
ALERT_PREFIX = "/alert-manager/api/v1/alerts"
REST_JOB_API_PREFIX = "/rest-server/api/v2/jobs"

TOKEN = os.environ.get('PAI_BEARER_TOKEN')

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


def datetime_to_hours(dt):
    """Converts datetime.timedelta to hours

    Parameters:
    -----------
    dt: datetime.timedelta

    Returns:
    --------
    float
    """
    return dt.days * 24 + dt.seconds / 3600


@enable_request_debug_log
def get_usage_info(job_usage_result, user_usage_result, rest_url):
    job_infos = {}
    user_infos = {}
    # get all jobs
    headers = {'Authorization': "Bearer {}".format(TOKEN)}
    resp = requests.get(rest_url, headers=headers)
    resp.raise_for_status()
    job_list = resp.json()

    for v in user_usage_result["data"]["result"]:
        user_infos[v["metric"]["username"]] = {
            "username": v["metric"]["username"],
            "usage": v["value"][1][:6] + "%", "resources_occupied": 0
        }
    for v in job_usage_result["data"]["result"]:
        job_name = v["metric"]["job_name"]

        matched_job = list(
            filter(lambda job: "{}~{}".format(job["username"], job["name"]) == job_name,
            job_list))

        # ingore unfounded jobs
        if not matched_job:
            logging.warning("Job %s not found.", job_name)
            continue
        job_info = matched_job[0]

        # ignore jobs not started
        if not job_info["launchedTime"]:
            logging.warning("job not start, ignore it")
            continue

        job_infos[job_name] = {
            "job_name": job_name,
            "usage": v["value"][1],
            "gpu_number": job_info["totalGpuNumber"]
        }

        # get job duration, only the during within 7d counts
        job_infos[job_name]["start_time"] = datetime.fromtimestamp(
            int(job_info["launchedTime"]) / 1000,
            timezone.utc)
        if job_infos[job_name]["start_time"] < datetime.now(timezone.utc) - timedelta(days = 7):
            job_infos[job_name]["start_time_in_7d"] = datetime.now(timezone.utc) - timedelta(days = 7)
        else:
            job_infos[job_name]["start_time_in_7d"] = job_infos[job_name]["start_time"]
        # job has not finished
        if not job_info["completedTime"]:
            job_infos[job_name]["duration"] = datetime.now(timezone.utc) - job_infos[job_name]["start_time_in_7d"]
        # job has finished
        else:
            job_infos[job_name]["duration"] = datetime.fromtimestamp(
                int(job_info["completedTime"]) / 1000,
                timezone.utc) - job_infos[job_name]["start_time_in_7d"]
        job_infos[job_name]["status"] = job_info["state"]

        job_infos[job_name]["resources_occupied"] = job_infos[job_name]["gpu_number"] * datetime_to_hours(job_infos[job_name]["duration"])
        username = job_info["username"]
        user_infos[username]["resources_occupied"] += job_infos[job_name]["resources_occupied"]

    # format
    for job_name, job_info in job_infos.items():
        job_infos[job_name]["usage"] = job_info["usage"][:6] + "%"
        job_infos[job_name]["gpu_number"] = str(job_info["gpu_number"])
        job_infos[job_name]["duration"] = str(job_info["duration"])
        job_infos[job_name]["start_time"] = job_info["start_time"].strftime("%y-%m-%d %H:%M:%S")
        job_infos[job_name]["resources_occupied"] = "{:.2f}".format(job_info["resources_occupied"])
    for username, user_info in user_infos.items():
        user_infos[username]["resources_occupied"] = "{:.2f}".format(user_info["resources_occupied"])

    # sort usage info by resources occupied
    job_usage = sorted(job_infos.values(), key=lambda x: float(x["resources_occupied"]), reverse=True)
    user_usage = sorted(user_infos.values(), key=lambda x: float(x["resources_occupied"]), reverse=True)

    return job_usage[:10], user_usage


@enable_request_debug_log
def collect_metrics(url):
    query_url = url.rstrip("/") + QUERY_PREFIX
    rest_url = url.rstrip("/") + REST_JOB_API_PREFIX

    # cluster info
    logging.info("Collecting cluster usage info...")
    resp = requests.get(query_url, params={"query": CLUSTER_QUERY_STRING})
    resp.raise_for_status()
    result = resp.json()
    cluster_usage = result["data"]["result"][0]["value"][1][:6] + "%"

    # user info
    logging.info("Collecting user usage info...")
    resp = requests.get(query_url, params={"query": USER_QUERY_STRING})
    resp.raise_for_status()
    user_usage_result = resp.json()

    # job info
    logging.info("Collecting job usage info...")
    resp = requests.get(query_url, params={"query": JOB_QUERY_STRING})
    resp.raise_for_status()
    job_usage_result = resp.json()
    job_usage, user_usage = get_usage_info(job_usage_result, user_usage_result, rest_url)

    return cluster_usage, job_usage, user_usage


@enable_request_debug_log
def send_alert(pai_url: str, cluster_usage, job_usage, user_usage):
    trigger_time = str(datetime.now(timezone.utc).date())
    post_url = pai_url.rstrip("/") + ALERT_PREFIX
    alerts = []
    # for cluster
    alert = {
        "labels": {
            "alertname": "usage",
            "report_type": "cluster-usage",
            "severity": "info",
            "cluster_usage": cluster_usage,
            "trigger_time": trigger_time,
        },
        "generatorURL": "alert/script"
    }
    alerts.append(alert)

    # for job
    for job in job_usage:
        alert = {
            "labels": {
                "alertname": "usage",
                "report_type": "cluster-usage",
                "severity": "info",
                "job_name": job["job_name"],
                "resources_occupied": job["resources_occupied"],
                "gpu_number": job["gpu_number"],
                "usage": job["usage"],
                "duration": job["duration"],
                "start_time": job["start_time"],
                "status": job["status"],
                "trigger_time": trigger_time,
            },
            "generatorURL": "alert/script"
        }
        alerts.append(alert)

    # for user
    for user in user_usage:
        alert = {
            "labels": {
                "alertname": "usage",
                "report_type": "cluster-usage",
                "severity": "info",
                "username": user["username"],
                "resources_occupied": user["resources_occupied"],
                "usage": user["usage"],
                "trigger_time": trigger_time,
            },
            "generatorURL": "alert/script"
        }
        alerts.append(alert)
    logging.info("Sending alerts to alert-manager...")
    resp = requests.post(post_url, json=alerts)
    resp.raise_for_status()
    logging.info("Alerts sent to alert-manager.")


def main():
    PAI_URI = os.environ.get("PAI_URI")
    # collect cluster gpu usage information
    cluster_usage, job_usage, user_usage = collect_metrics(PAI_URI)
    # send alert to alert manager
    send_alert(PAI_URI, cluster_usage, job_usage, user_usage)


if __name__ == "__main__":
    logging.basicConfig(
        format=
        "%(asctime)s - %(levelname)s - %(filename)s:%(lineno)s - %(message)s",
        level=logging.INFO,
    )
    main()
