#!/usr/bin/python
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
# BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
# DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import argparse
import urlparse
import os
import json
import sys
import requests
import logging
import time
import threading

import paramiko
import yaml
from wsgiref.simple_server import make_server
from prometheus_client import make_wsgi_app, Counter, Summary, Histogram
from prometheus_client.core import GaugeMetricFamily, CounterMetricFamily, Summary, REGISTRY

logger = logging.getLogger(__name__)


##### watchdog will generate following metrics
# Document about these metrics is in `prometheus/doc/watchdog-metrics.md`

error_counter = Counter("process_error_log_total", "total count of error log", ["type"])

api_healthz_histogram = Histogram("k8s_api_healthz_resp_latency_seconds",
        "Response latency for requesting k8s api healthz (seconds)")

# use `histogram_quantile(0.95, sum(rate(k8s_etcd_resp_latency_seconds_bucket[5m])) by (le))`
# to get 95 percentile latency in past 5 miniute.
etcd_healthz_histogram = Histogram("k8s_etcd_resp_latency_seconds",
        "Response latency for requesting etcd healthz (seconds)")

list_pods_histogram = Histogram("k8s_api_list_pods_latency_seconds",
        "Response latency for list pods from k8s api (seconds)")

list_nodes_histogram = Histogram("k8s_api_list_nodes_latency_seconds",
        "Response latency for list nodes from k8s api (seconds)")

def gen_pai_pod_gauge():
    return GaugeMetricFamily("pai_pod_count", "count of pai pod",
            labels=["service_name", "name", "phase", "host_ip",
                "initialized", "pod_scheduled", "ready"])

def gen_pai_container_gauge():
    return GaugeMetricFamily("pai_container_count", "count of container pod",
            labels=["service_name", "pod_name", "name", "state", "host_ip", "ready"])

def gen_pai_node_gauge():
    return GaugeMetricFamily("pai_node_count", "count of pai node",
            labels=["name", "disk_pressure", "memory_pressure", "out_of_disk", "ready"])

def gen_k8s_component_gauge():
    return GaugeMetricFamily("k8s_component_count", "count of k8s component",
            labels=["service_name", "error", "host_ip"])

##### watchdog will generate above metrics

class AtomicRef(object):
    """ a thread safe way to store and get object, should not modify data get from this ref """
    def __init__(self):
        self.data = None
        self.lock = threading.RLock()

    def get_and_set(self, new_data):
        data = None
        with self.lock:
            data, self.data = self.data, new_data
        return data

    def get(self):
        with self.lock:
            return self.data


class CustomCollector(object):
    def __init__(self, atomic_ref):
        self.atomic_ref = atomic_ref

    def collect(self):
        data = self.atomic_ref.get()

        if data is not None:
            for datum in data:
                yield datum
        else:
            # https://stackoverflow.com/a/6266586
            # yield nothing
            return
            yield


def catch_exception(fn, msg, default, *args, **kwargs):
    """ wrap fn call with try catch, makes watchdog more robust """
    try:
        return fn(*args, **kwargs)
    except Exception as e:
        error_counter.labels(type="parse").inc()
        logger.exception(msg)
        return default


def parse_pod_item(pai_pod_gauge, pai_container_gauge, pod):
    """ add metrics to pai_pod_gauge or pai_container_gauge if successfully paesed pod.
    Because we are parsing json outputed by k8s, its format is subjected to change,
    we should test if field exists before accessing it to avoid KeyError """

    pod_name = pod["metadata"]["name"]
    labels = pod["metadata"].get("labels")
    if labels is None or "app" not in labels.keys():
        logger.warning("unkown pod %s", pod["metadata"]["name"])
        return None

    service_name = labels["app"] # get pai service name from label

    status = pod["status"]

    if status.get("phase") is not None:
        phase = status["phase"].lower()
    else:
        phase = "unknown"

    host_ip = "unscheduled" # can not specify None here, None will cause None exception
    if status.get("hostIP") is not None:
        host_ip = status["hostIP"]

    initialized = pod_scheduled = ready = "unknown"

    conditions = status.get("conditions")
    if conditions is not None:
        for cond in conditions:
            cond_t = cond["type"] # Initialized|Ready|PodScheduled
            cond_status = cond["status"].lower()

            if cond_t == "Initialized":
                initialized = cond_status
            elif cond_t == "PodScheduled":
                pod_scheduled = cond_status
            elif cond_t == "Ready":
                ready = cond_status
            else:
                error_counter.labels(type="unknown_pod_cond").inc()
                logger.error("unexpected condition %s in pod %s", cond_t, pod_name)

    pai_pod_gauge.add_metric([service_name, pod_name, phase, host_ip,
        initialized, pod_scheduled, ready], 1)

    # generate pai_containers
    if status.get("containerStatuses") is not None:
        container_statuses = status["containerStatuses"]

        for container_status in container_statuses:
            container_name = container_status["name"]

            ready = False

            if container_status.get("ready") is not None:
                ready = container_status["ready"]

            container_state = None
            if container_status.get("state") is not None:
                state = container_status["state"]
                if len(state) != 1:
                    error_counter.labels(type="unexpected_container_state").inc()
                    logger.error("unexpected state %s in container %s",
                            json.dumps(state), container_name)
                else:
                    container_state = state.keys()[0].lower()

            pai_container_gauge.add_metric([service_name, pod_name, container_name,
                container_state, host_ip, str(ready).lower()], 1)

    return pai_pod_gauge, pai_container_gauge


def process_pods_status(pai_pod_gauge, pai_container_gauge, podsJsonObject):
    def _map_fn(item):
        return catch_exception(parse_pod_item,
                "catch exception when parsing pod item",
                None,
                pai_pod_gauge, pai_container_gauge, item)

    map(_map_fn, podsJsonObject["items"])


def collect_healthz(gauge, histogram, service_name, scheme, address, port, url, ca_path, headers):
    with histogram.time():
        error = "ok"
        try:
            error = requests.get("{}://{}:{}{}".format(scheme, address, port, url), headers = headers, verify = ca_path).text
        except Exception as e:
            error_counter.labels(type="healthz").inc()
            error = str(e)
            logger.exception("requesting %s:%d%s failed", address, port, url)

        gauge.add_metric([service_name, error, address], 1)


def collect_k8s_component(k8s_gauge, api_server_scheme, api_server_ip, api_server_port, ca_path, headers):
    collect_healthz(k8s_gauge, api_healthz_histogram,
            "k8s_api_server", api_server_scheme, api_server_ip, api_server_port, "/healthz", ca_path, headers)
    collect_healthz(k8s_gauge, etcd_healthz_histogram,
            "k8s_etcd", api_server_scheme, api_server_ip, api_server_port, "/healthz/etcd", ca_path, headers)

def parse_node_item(pai_node_gauge, node):
    name = node["metadata"]["name"]

    disk_pressure = memory_pressure = out_of_disk = ready = "unknown"

    if node.get("status") is not None:
        status = node["status"]

        if status.get("conditions") is not None:
            conditions = status["conditions"]

            for cond in conditions:
                cond_t = cond["type"]
                status = cond["status"].lower()

                if cond_t == "DiskPressure":
                    disk_pressure = status
                elif cond_t == "MemoryPressure":
                    memory_pressure = status
                elif cond_t == "OutOfDisk":
                    out_of_disk = status
                elif cond_t == "Ready":
                    ready = status
                else:
                    error_counter.labels(type="unknown_node_cond").inc()
                    logger.error("unexpected condition %s in node %s", cond_t, name)
    else:
        logger.warning("unexpected structure of node %s: %s", name, json.dumps(node))

    pai_node_gauge.add_metric([name, disk_pressure, memory_pressure, out_of_disk, ready], 1)

    return pai_node_gauge


def process_nodes_status(pai_node_gauge, nodesJsonObject):
    def _map_fn(item):
        return catch_exception(parse_node_item,
                "catch exception when parsing node item",
                None,
                pai_node_gauge, item)

    map(_map_fn, nodesJsonObject["items"])


def load_machine_list(configFilePath):
    with open(configFilePath, "r") as f:
        return yaml.load(f)["hosts"]


def request_with_histogram(url, histogram, ca_path, headers):
    with histogram.time():
        return requests.get(url, headers = headers, verify = ca_path).json()


def try_remove_old_prom_file(path):
    """ try to remove old prom file, since old prom file are exposed by node-exporter,
    if we do not remove, node-exporter will still expose old metrics """
    if os.path.isfile(path):
        try:
            os.unlink(path)
        except Exception as e:
            log.warning("can not remove old prom file %s", path)

def main(args):
    logDir = args.log

    try_remove_old_prom_file(logDir + "/watchdog.prom")

    address = args.k8s_api
    parse_result = urlparse.urlparse(address)
    api_server_scheme = parse_result.scheme
    api_server_ip = parse_result.hostname
    api_server_port = parse_result.port or 80
    ca_path = args.ca
    bearer_path = args.bearer
    if (ca_path is None and bearer_path is not None) or (ca_path is not None and bearer_path is None):
        log.warning("please provide bearer_path and ca_path at the same time or not")        
    headers = None
    if bearer_path is not None:
        with open(bearer_path, 'r') as bearer_file:
           bearer = bearer_file.read()
           headers = {'Authorization': "Bearer {}".format(bearer)}

    list_pods_url = "{}/api/v1/namespaces/default/pods/".format(address)
    list_nodes_url = "{}/api/v1/nodes/".format(address)

    atomic_ref = AtomicRef()

    REGISTRY.register(CustomCollector(atomic_ref))

    app = make_wsgi_app(REGISTRY)
    httpd = make_server("", int(args.port), app)
    t = threading.Thread(target=httpd.serve_forever)
    t.daemon = True
    t.start()

    while True:
        # these gauge is generate on each iteration
        pai_pod_gauge = gen_pai_pod_gauge()
        pai_container_gauge = gen_pai_container_gauge()
        pai_node_gauge = gen_pai_node_gauge()
        k8s_gauge = gen_k8s_component_gauge()

        try:
            # 1. check service level status
            podsStatus = request_with_histogram(list_pods_url, list_pods_histogram, ca_path, headers)
            process_pods_status(pai_pod_gauge, pai_container_gauge, podsStatus)

            # 2. check nodes level status
            nodes_status = request_with_histogram(list_nodes_url, list_nodes_histogram, ca_path, headers) 
            process_nodes_status(pai_node_gauge, nodes_status)

            # 3. check k8s level status
            collect_k8s_component(k8s_gauge, api_server_scheme, api_server_ip, api_server_port, ca_path, headers)
        except Exception as e:
            error_counter.labels(type="unknown").inc()
            logger.exception("watchdog failed in one iteration")

        atomic_ref.get_and_set([pai_pod_gauge, pai_container_gauge, pai_node_gauge,
            k8s_gauge])

        time.sleep(float(args.interval))


def get_logging_level():
    mapping = {
            "DEBUG": logging.DEBUG,
            "INFO": logging.INFO,
            "WARNING": logging.WARNING
            }

    result = logging.INFO

    if os.environ.get("LOGGING_LEVEL") is not None:
        level = os.environ["LOGGING_LEVEL"]
        result = mapping.get(level.upper())
        if result is None:
            sys.stderr.write("unknown logging level " + level + ", default to INFO\n")
            result = logging.INFO

    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("k8s_api", help="kubernetes api uri eg. http://10.151.40.133:8080")
    parser.add_argument("--log", "-l", help="log dir to store log", default="/datastorage/prometheus")
    parser.add_argument("--interval", "-i", help="interval between two collection", default="30")
    parser.add_argument("--port", "-p", help="port to expose metrics", default="9101")
    parser.add_argument("--ca", "-c", help="ca file path")
    parser.add_argument("--bearer", "-b", help="bearer token file path")    
    args = parser.parse_args()

    logging.basicConfig(format="%(asctime)s - %(levelname)s - %(filename)s:%(lineno)s - %(message)s",
            level=get_logging_level())

    main(args)
