#!/usr/bin/env python3
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
# BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND # NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
# DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

# This script is intended to generate reports about OpenPai cluster, it has two
# actions, one is refresh, another is report.
# The refresh action will tries to collect data from Yarn and framework-launcher,
# and save the data in sqlite3 DB for future process. We recommend admin run this
# script every 1 minute using CRON job.
# The report action will query data about vc usage and job statistic from sqlite3
# DB and generate vc/job reports, it will also get data from prometheus to generate
# alert reports. This action will query last 31 days data.

# The reports will be 3 csv files vc.csv, job.csv and alert.csv, columns will have
# following meaning:
# vc.csv
# * user: username in OpenPai cluster
# * vc: VC name in OpenPai cluster
# * cpu: number of vcore allocated for jobs
# * mem: number of memory(MB) allocated for jobs
# * gpu: number of GPU card allocated for jobs

# jobs.csv
# * user: username in OpenPai cluster
# * vc: VC name in OpenPai cluster
#
# other fields are grouped into 5 groups, they are:
# * total job: sum of all jobs
# * successful job: those finished and exit code is 0
# * failed job: those finished and exit code is not 0
# * stopped job: those stopped by user
# * running job: those running
#
# each group will have following subcolumn:
# * count: job count of this subcolumn
# * elapsed time: job running time of this subcolumn
# * cpu second: how much vcore-second used by jobs of this subcolumn
# * memory second: how much memory(MB)-second used by jobs of this subcolumn
# * gpu second: how much gpu-second used by jobs of this subcolumn

# alert.csv
# alert name: alert name defined in prometheus
# instance: where this alert was triggered
# start: start time of this alert
# durtion: how much time(seconds) this alert lasts

import urllib.parse
import argparse
import logging
import datetime
import json
import collections
import re
import sys

import sqlite3
import requests

logger = logging.getLogger(__name__)


def walk_json_field_safe(obj, *fields):
    """ for example a=[{"a": {"b": 2}}]
    walk_json_field_safe(a, 0, "a", "b") will get 2
    walk_json_field_safe(a, 0, "not_exist") will get None
    """
    try:
        for f in fields:
            obj = obj[f]
        return obj
    except:
        return None


def request_with_error_handling(url):
    try:
        response = requests.get(url, allow_redirects=True)
    except Exception as e:
        logger.exception(e)
        return None

    if response.status_code != 200:
        logger.warning("requesting %s with code %d", url, response.status_code)
        return None

    return response.json()


class VcUsage(object):
    def __init__(self, user, vc, cpu, mem, gpu, time=None):
        """ user/vc is string, cpu/mem/gpu is int
        cpu is virtual core in hadoop,
        mem is in byte,
        gpu is the number of gpu card """
        self.user = user
        self.vc = vc
        self.cpu = cpu
        self.mem = mem
        self.gpu = gpu
        if time is not None:
            self.time = int(time)
        else:
            self.time = int(datetime.datetime.timestamp(datetime.datetime.now()))


class JobInfo(object):
    def __init__(self, job_count=0, elapsed_time=0, cpu_sec=0, mem_sec=0, gpu_sec=0):
        """ elapsed_time is seconds, cpu_sec is vcore-seconds, mem_sec is
        megabyte-seconds, gpu_sec is card-seconds """
        self.job_count = job_count
        self.elapsed_time = elapsed_time
        self.cpu_sec = cpu_sec
        self.mem_sec = mem_sec
        self.gpu_sec = gpu_sec

    def __iadd__(self, o):
        self.job_count += o.job_count
        self.elapsed_time += o.elapsed_time
        self.cpu_sec += o.cpu_sec
        self.mem_sec += o.mem_sec
        self.gpu_sec += o.gpu_sec
        return self

    def __add__(self, o):
        return JobInfo(
                job_count=self.job_count + o.job_count,
                elapsed_time=self.elapsed_time + o.elapsed_time,
                cpu_sec=self.cpu_sec + o.cpu_sec,
                mem_sec=self.mem_sec + o.mem_sec,
                gpu_sec=self.gpu_sec + o.gpu_sec)

    def __repr__(self):
        return "%d,%d,%d,%d,%d" % (self.job_count, self.elapsed_time,
                self.cpu_sec, self.mem_sec, self.gpu_sec)


class JobReportEntries(object):
    def __init__(self, username, vc, total_job_info, success_job_info,
            failed_job_info, stopped_job_info, running_job_info):
        self.username = username
        self.vc = vc
        self.total_job_info = total_job_info
        self.success_job_info = success_job_info
        self.failed_job_info = failed_job_info
        self.stopped_job_info = stopped_job_info
        self.running_job_info = running_job_info

    def __repr__(self):
        return "%s,%s,%s,%s,%s,%s,%s" % (
                self.username,
                self.vc,
                self.total_job_info,
                self.success_job_info,
                self.failed_job_info,
                self.stopped_job_info,
                self.running_job_info)


class Alert(object):
    def __init__(self, alert_name, instance, start, durtion):
        """ alert_name/instance are derived from labels, start/durtion is timestamp
        value """
        self.alert_name = alert_name
        self.instance = instance
        self.start = start
        self.durtion = durtion

    def __repr__(self):
        return "%s,%s,%s,%s" % (self.alert_name, self.instance, self.start, self.durtion)


class DB(object):
    # If app is running, the finished_time is 0, should not delete it in delete_old_data
    CREATE_APPS_TABLE = """CREATE TABLE IF NOT EXISTS apps (
                            app_id text NOT NULL,
                            finished_time integer NOT NULL,
                            content text NOT NULL
                            )"""
    CREATE_APP_ID_INDEX = """CREATE INDEX IF NOT EXISTS app_id_index ON apps (app_id);"""
    CREATE_APP_TIME_INDEX = """CREATE INDEX IF NOT EXISTS app_time_index ON apps (finished_time);"""

    # If job is running, the finished_time is 0, should not delete it in delete_old_data
    CREATE_FRAMEWORKS_TABLE = """CREATE TABLE IF NOT EXISTS frameworks (
                            name text NOT NULL,
                            finished_time integer NOT NULL,
                            content text NOT NULL
                            )"""
    CREATE_FRAMEWORK_NAME_INDEX = """CREATE INDEX IF NOT EXISTS framework_name_index ON frameworks (name);"""
    CREATE_FRAMEWORK_TIME_INDEX = """CREATE INDEX IF NOT EXISTS framework_time_index ON frameworks (finished_time);"""

    CREATE_VC_USAGE_TABLE = """CREATE TABLE IF NOT EXISTS vc_usage (
                            username text NOT NULL,
                            vc text NOT NULL,
                            cpu integer NOT NULL,
                            mem integer NOT NULL,
                            gpu integer NOT NULL,
                            time integer NOT NULL
                            )"""

    def __init__(self, db_path="pai_report.sqlite"):
        self.db_path = db_path
        self.conn = sqlite3.connect(self.db_path)
        cursor = self.conn.cursor()
        cursor.execute(DB.CREATE_APPS_TABLE)
        cursor.execute(DB.CREATE_APP_ID_INDEX)
        cursor.execute(DB.CREATE_APP_TIME_INDEX)
        cursor.execute(DB.CREATE_FRAMEWORKS_TABLE)
        cursor.execute(DB.CREATE_FRAMEWORK_NAME_INDEX)
        cursor.execute(DB.CREATE_FRAMEWORK_TIME_INDEX)
        cursor.execute(DB.CREATE_VC_USAGE_TABLE)
        self.conn.commit()


def get_vc_usage(yarn_url):
    scheduler_url = urllib.parse.urljoin(yarn_url, "/ws/v1/cluster/scheduler")
    result = []

    obj = request_with_error_handling(scheduler_url)

    if obj.get("scheduler") is None:
        return result

    scheduler_info = obj["scheduler"]["schedulerInfo"]

    for queue in scheduler_info["queues"]["queue"]:
        queue_name = queue["queueName"]

        users = walk_json_field_safe(queue, "users", "user")
        if users is not None:
            for user in users:
                username = user["username"]

                cpu = mem = gpu = 0
                if user.get("resourcesUsed") is not None:
                    cpu += user["resourcesUsed"].get("vCores", 0)
                    mem += user["resourcesUsed"].get("memory", 0) * 1024 * 1024
                    gpu += user["resourcesUsed"].get("GPUs", 0)
                if user.get("AMResourceUsed") is not None:
                    cpu += user["AMResourceUsed"].get("vCores", 0)
                    mem += user["AMResourceUsed"].get("memory", 0) * 1024 * 1024
                    gpu += user["AMResourceUsed"].get("GPUs", 0)

                result.append(VcUsage(username, queue_name, cpu, mem, gpu))

    return result


def get_yarn_apps(yarn_url):
    apps_url = urllib.parse.urljoin(yarn_url, "/ws/v1/cluster/apps")
    result = []

    obj = request_with_error_handling(apps_url)

    if obj.get("apps") is None or obj["apps"].get("app") is None:
        return result

    apps = obj["apps"]["app"]
    for app in apps:
        app_id = walk_json_field_safe(app, "id")
        if app_id is None:
            continue

        finished_time = walk_json_field_safe(app, "finishedTime") or 0
        finished_time = int(finished_time / 1000) # yarn's time is in millisecond
        content = json.dumps(app)
        result.append({"app_id": app_id, "finished_time": finished_time,
            "content": content})

    return result


def get_frameworks(launcher_url):
    launcher_url = urllib.parse.urljoin(launcher_url, "/v1/Frameworks")
    result = []

    obj = request_with_error_handling(launcher_url)

    if obj.get("summarizedFrameworkInfos") is None:
        return result

    frameworks = obj["summarizedFrameworkInfos"]
    for framework in frameworks:
        name = walk_json_field_safe(framework, "frameworkName")
        if name is None:
            continue

        finished_time = walk_json_field_safe(framework, "frameworkCompletedTimestamp") or 0
        finished_time = int(finished_time / 1000) # yarn's time is in millisecond
        content = json.dumps(framework)
        result.append({"name": name, "finished_time": finished_time,
            "content": content})

    return result


def refresh_cache(yarn_url, launcher_url):
    db = DB()

    vc_usages = get_vc_usage(yarn_url)
    logger.info("get %d of usage from yarn", len(vc_usages))

    with db.conn:
        cursor = db.conn.cursor()

        for usage in vc_usages:
            cursor.execute("""INSERT INTO vc_usage(username,vc,cpu,mem,gpu,time)
                            VALUES(?,?,?,?,?,?)""",
                            (usage.user, usage.vc, usage.cpu, usage.mem,
                                usage.gpu, usage.time))

        db.conn.commit()

    apps = get_yarn_apps(yarn_url)
    logger.info("get %d of apps from yarn", len(apps))

    with db.conn:
        cursor = db.conn.cursor()

        for app in apps:
            cursor.execute("""SELECT COUNT(*) FROM apps
                            WHERE app_id=?""",
                            (app["app_id"],))
            result = cursor.fetchone()

            if result[0] > 0:
                cursor.execute("""UPDATE apps SET finished_time=?, content=?
                                WHERE app_id=?""",
                                (app["finished_time"], app["content"], app["app_id"]))
            else:
                cursor.execute("""INSERT INTO apps(app_id,finished_time,content)
                                VALUES(?,?,?)""",
                                (app["app_id"], app["finished_time"], app["content"]))

        db.conn.commit()

    frameworks = get_frameworks(launcher_url)
    logger.info("get %d of frameworks from launcher", len(frameworks))

    with db.conn:
        cursor = db.conn.cursor()

        for framework in frameworks:
            cursor.execute("""SELECT COUNT(*) FROM frameworks
                            WHERE name=?""",
                            (framework["name"],))
            result = cursor.fetchone()

            if result[0] > 0:
                cursor.execute("""UPDATE frameworks SET finished_time=?, content=?
                                WHERE name=?""",
                                (framework["finished_time"], framework["content"], framework["name"]))
            else:
                cursor.execute("""INSERT INTO frameworks(name,finished_time,content)
                                VALUES(?,?,?)""",
                                (framework["name"], framework["finished_time"], framework["content"]))

        db.conn.commit()


def get_vc_report(days):
    db = DB()
    now = datetime.datetime.now()
    delta = datetime.timedelta(days=days)

    one_month_ago = int(datetime.datetime.timestamp(now - delta))

    with db.conn:
        cursor = db.conn.cursor()
        cursor.execute("""SELECT username,vc,cpu,mem,gpu FROM vc_usage
                        WHERE time>?""",
                        (one_month_ago,))
        result = cursor.fetchall()

    logger.info("get %d vc usage entries", len(result))
    agg = collections.defaultdict(lambda : collections.defaultdict(lambda :[0, 0, 0]))
    for username, vc, cpu, mem, gpu in result:
        c, m, g = agg[username][vc]
        agg[username][vc] = [c + cpu, m + mem, g + gpu]

    result = []

    for username, vcs in agg.items():
        for vc, val in vcs.items():
            result.append(VcUsage(username, vc, val[0], val[1], val[2]))

    return result


# https://github.com/Microsoft/pai/blob/pai-0.9.y/src/rest-server/src/models/job.js#L45
def convert_job_state(framework_state, exit_code):
    if framework_state in {
            "FRAMEWORK_WAITING",
            "APPLICATION_CREATED",
            "APPLICATION_LAUNCHED",
            "APPLICATION_WAITING"}:
        return "WAITING"
    elif framework_state in {
            "APPLICATION_RUNNING",
            "APPLICATION_RETRIEVING_DIAGNOSTICS",
            "APPLICATION_COMPLETED"}:
        return "RUNNING"
    elif framework_state == "FRAMEWORK_COMPLETED":
        if exit_code is not None:
            if exit_code == 0:
                return "SUCCEEDED"
            elif exit_code == 214:
                return "STOPPED"
            else:
                return "FAILED"
        else:
            return "FAILED"

    return "UNKNOWN"


def get_job_report(days):
    db = DB()
    now = datetime.datetime.now()
    delta = datetime.timedelta(days=days)

    ago = int(datetime.datetime.timestamp(now - delta))
    print(ago)

    with db.conn:
        cursor = db.conn.cursor()
        cursor.execute("""SELECT content FROM apps
                        WHERE finished_time>? OR finished_time=0""",
                        (ago,))
        apps = cursor.fetchall()

        logger.info("get %d apps entries", len(apps))

        cursor.execute("""SELECT content FROM frameworks
                        WHERE finished_time>? OR finished_time=0""",
                        (ago,))
        frameworks = cursor.fetchall()

        logger.info("get %d frameworks entries", len(frameworks))

    # key is framework_name, value is JobInfo
    processed_apps = collections.defaultdict(lambda : JobInfo())

    pattern = re.compile(u"\[([^[\]]+)\]+_.*")

    for content, in apps:
        app = json.loads(content)

        name = walk_json_field_safe(app, "name")
        if name is None:
            continue

        match = pattern.match(name)
        if match is None:
            continue

        job_name = match.groups()[0]

        elapsed_time = walk_json_field_safe(app, "elapsedTime") or 0
        cpu_sec = walk_json_field_safe(app, "vcoreSeconds") or 0
        mem_sec = walk_json_field_safe(app, "memorySeconds") or 0
        gpu_sec = walk_json_field_safe(app, "gpuSeconds") or 0

        info = JobInfo(job_count=0, elapsed_time=elapsed_time,
                cpu_sec=cpu_sec, mem_sec=mem_sec, gpu_sec=gpu_sec)

        processed_apps[job_name] += info

    statistic = collections.defaultdict(lambda : # key is username
                collections.defaultdict(lambda : # key is vc
                collections.defaultdict(lambda : JobInfo()))) # key is job_status

    for content, in frameworks:
        framework = json.loads(content)

        name = walk_json_field_safe(framework, "frameworkName")
        username = walk_json_field_safe(framework, "userName")
        vc = walk_json_field_safe(framework, "queue")
        state = walk_json_field_safe(framework, "frameworkState")
        exit_code = walk_json_field_safe(framework, "applicationExitCode")

        job_status = convert_job_state(state, exit_code)

        if name in processed_apps:
            processed_apps[name].job_count = 1
            statistic[username][vc][job_status] += processed_apps[name]

    result = []
    for username, val in statistic.items():
        for vc, sub_val in val.items():
            total_job_info = JobInfo()
            mapping = {
                    "SUCCEEDED": JobInfo(),
                    "FAILED": JobInfo(),
                    "STOPPED": JobInfo(),
                    "RUNNING": JobInfo()}

            for job_status, job_info in sub_val.items():
                if job_status in mapping:
                    mapping[job_status] += job_info
                total_job_info += job_info

            result.append(JobReportEntries(username, vc, total_job_info,
                mapping["SUCCEEDED"], mapping["FAILED"], mapping["STOPPED"],
                mapping["RUNNING"]))

    return result


def get_alerts(prometheus_url, days):
    now = datetime.datetime.now()
    delta = datetime.timedelta(days=days)

    ago = datetime.datetime.timestamp(now - delta)
    now = datetime.datetime.timestamp(now)

    args = urllib.parse.urlencode({
        "query": "ALERTS{alertstate=\"firing\"}",
        "start": str(ago),
        "end": str(now),
        "step": "5m",
        })

    url = urllib.parse.urljoin(prometheus_url,
            "/prometheus/api/v1/query_range") + "?" + args

    logger.debug("requesting %s", url)
    result = []

    obj = request_with_error_handling(url)

    if walk_json_field_safe(obj, "status") != "success":
        logger.warning("requesting %s failed, body is %s", url, obj)
        return result

    gap = 5 * 60 # because the step is 5m, the gap between two data point should be this

    metrics = walk_json_field_safe(obj, "data", "result")

    for metric in metrics:
        alert_name = walk_json_field_safe(metric, "metric", "alertname") or "unknown"
        instance = walk_json_field_safe(metric, "metric", "instance") or "unknown"

        values = walk_json_field_safe(metric, "values")
        if values is not None and len(values) > 0:
            start = end = values[0][0]
            events = []

            for i, value in enumerate(values):
                if i == len(values) - 1:
                    events.append({"start": start, "end": value[0]})
                    break

                if value[0] - end <= gap:
                    end = value[0]
                    continue
                else:
                    events.append({"start": start, "end": end})
                    start = end = value[0]

            for event in events:
                # because the end is the last time alert still happening, if we
                # treat end - start equals to be the durtion of the alert,
                # the alert with start == end will have durtion of 0, which is
                # quite confusing, so we set durtion to be end - start + gap
                result.append(Alert(alert_name, instance, int(event["start"]),
                    int(event["end"] - event["start"] + gap)))
        else:
            logger.warning("unexpected zero values in alert %s", alert_name)

    logger.info("get %d alert entries", len(result))

    return result


def delete_old_data():
    db = DB()
    now = datetime.datetime.now()
    delta = datetime.timedelta(days=31)

    one_month_ago = int(datetime.datetime.timestamp(now - delta))

    with db.conn:
        cursor = db.conn.cursor()
        cursor.execute("""DELETE FROM vc_usage WHERE time<?""",
                        (one_month_ago,))

        # should not delete entries if finished_time is 0, they are running apps
        cursor.execute("""DELETE FROM apps WHERE finished_time<? AND finished_time!=0""",
                        (one_month_ago,))

        # should not delete entries if finished_time is 0, they are running jobs
        cursor.execute("""DELETE FROM frameworks WHERE finished_time<? AND finished_time!=0""",
                        (one_month_ago,))

        db.conn.commit()


def gen_report(prometheus_url, path, day):
    vc_report = get_vc_report(day)
    vc_file = "%s_vc.csv" % path
    with open(vc_file, "w") as f:
        f.write("user,vc,cpu,mem,gpu\n")
        for r in vc_report:
            f.write("%s,%s,%d,%d,%d\n" % (r.user, r.vc, r.cpu, r.mem, r.gpu))

    job_report = get_job_report(day)
    job_file = "%s_job.csv" % path
    with open(job_file, "w") as f:
        f.write("user,vc," +
        "total_count,total_time,total_cpu_sec,total_mem_sec,total_gpu_sec," +
        "succ_count,succ_time,succ_cpu_sec,succ_mem_sec,succ_gpu_sec," +
        "fail_count,fail_time,fail_cpu_sec,fail_mem_sec,fail_gpu_sec," +
        "stop_count,stop_time,stop_cpu_sec,stop_mem_sec,stop_gpu_sec," +
        "run_count,run_time,run_cpu_sec,run_mem_sec,run_gpu_sec\n")
        for r in job_report:
            f.write("%s\n" % r)

    alert_report = get_alerts(prometheus_url, day)
    alert_file = "%s_alert.csv" % path
    with open(alert_file, "w") as f:
        f.write("alert_name,instance,start,durtion")
        for r in alert_report:
            f.write("%s\n" % r)

    logger.info("write csv file into %s, %s and %s",
            vc_file, job_file, alert_file)

def main(args):
    if args.action == "refresh":
        delete_old_data()
        refresh_cache(args.yarn_url, args.launcher_url)
    elif args.action == "report":
        gen_report(args.prometheus_url, args.file, args.day)
    else:
        print("unknown action %s" % (args.action))
        sys.exit(1)


if __name__ == "__main__":
    logging.basicConfig(format="%(asctime)s - %(levelname)s - %(filename)s:%(lineno)s - %(message)s",
            level=logging.INFO)

    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["refresh", "report"])
    parser.add_argument("--yarn_url", "-y", required=True,
            help="Yarn rest api address, eg: http://127.0.0.1:8088")
    parser.add_argument("--prometheus_url", "-p", required=True,
            help="Prometheus url, eg: http://127.0.0.1:9091")
    parser.add_argument("--launcher_url", "-l", required=True,
            help="Framework launcher url, eg: http://127.0.0.1:9086")
    parser.add_argument("--day", "-d", type=int, default=31,
            help="how many day's data need to queried")
    parser.add_argument("--file", "-f", required=False,
            help="Output file prefix, required argument when action is report",
            default="pai_report_%s" % datetime.datetime.now().replace(microsecond=0).isoformat())

    args = parser.parse_args()

    main(args)
