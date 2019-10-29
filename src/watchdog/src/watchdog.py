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
import urllib.parse
import os
import json
import sys
import requests
import logging
import time
import threading
import signal
import faulthandler
import gc
import re
import collections

import yaml
import prometheus_client
from prometheus_client import Counter, Summary, Histogram
from prometheus_client.core import GaugeMetricFamily, CounterMetricFamily, Summary, REGISTRY
from prometheus_client.twisted import MetricsResource

from twisted.web.server import Site
from twisted.web.resource import Resource
from twisted.internet import reactor

logger = logging.getLogger(__name__)

KUBE_APISERVER_ADDRESS="KUBE_APISERVER_ADDRESS"
# k8s will set following environment variables for pod.
# refer to https://kubernetes.io/docs/tasks/access-application-cluster/access-cluster/
KUBE_INCLUSTER_HOST="KUBERNETES_SERVICE_HOST"
KUBE_INCLUSTER_PORT="KUBERNETES_SERVICE_PORT"


##### watchdog will generate following metrics
# Document about these metrics is in `prometheus/doc/watchdog-metrics.md`

error_counter = Counter("process_error_log_total", "total count of error log", ["type"])

api_healthz_histogram = Histogram("k8s_api_healthz_resp_latency_seconds",
        "Response latency for requesting k8s api healthz (seconds)")

# use `histogram_quantile(0.95, sum(rate(k8s_api_list_pods_latency_seconds_bucket[5m])) by (le))`
# to get 95 percentile latency in past 5 miniute.
list_pods_histogram = Histogram("k8s_api_list_pods_latency_seconds",
        "Response latency for list pods from k8s api (seconds)")

list_nodes_histogram = Histogram("k8s_api_list_nodes_latency_seconds",
        "Response latency for list nodes from k8s api (seconds)")

def gen_pai_pod_gauge():
    return GaugeMetricFamily("pai_pod_count", "count of pai pod",
            labels=["service_name", "name", "namespace", "phase", "host_ip",
                "initialized", "pod_scheduled", "ready"])

def gen_pai_job_pod_gauge():
    return GaugeMetricFamily("pai_job_pod_count", "count of pai job pod",
            labels=["job_name", "name", "phase", "host_ip",
                "initialized", "pod_bound", "pod_scheduled", "ready"])

def gen_pai_container_gauge():
    return GaugeMetricFamily("pai_container_count", "count of container pod",
            labels=["service_name", "pod_name", "name", "namespace", "state",
                "host_ip", "ready"])

def gen_pai_node_gauge():
    return GaugeMetricFamily("pai_node_count", "count of pai node",
            labels=["name", "disk_pressure", "memory_pressure", "out_of_disk", "ready", "unschedulable"])

def gen_k8s_api_gauge():
    return GaugeMetricFamily("k8s_api_server_count", "count of k8s api server",
            labels=["error", "host_ip"])

def gen_k8s_node_gpu_available():
    return GaugeMetricFamily("k8s_node_gpu_available", "gpu available on k8s node",
            labels=["host_ip"])

# reserved gpu means gpu not allocated to tasks and the node is being marked as
# unschedulable.
def gen_k8s_node_gpu_reserved():
    return GaugeMetricFamily("k8s_node_gpu_reserved", "gpu reserved on k8s node",
            labels=["host_ip"])

def gen_k8s_node_gpu_total():
    return GaugeMetricFamily("k8s_node_gpu_total", "gpu total on k8s node",
            labels=["host_ip"])

##### watchdog will generate above metrics

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

def convert_to_byte(data):
    data = data.lower()
    number = float(re.findall(r"[0-9.]+", data)[0])
    if "t" in data:
        return number * 10 ** 12
    elif "g" in data:
        return number * 10 ** 9
    elif "m" in data:
        return number * 10 ** 6
    elif "k" in data:
        return number * 10 ** 3
    elif "ti" in data:
        return number * 2 ** 40
    elif "gi" in data:
        return number * 2 ** 30
    elif "mi" in data:
        return number * 2 ** 20
    elif "ki" in data:
        return number * 2 ** 10
    else:
        return number

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

class PodInfo(object):
    def __init__(self, name, gpu):
        self.name = name
        self.gpu = gpu

    def __repr__(self):
        return "%s: %s" % (self.name, self.gpu)

def parse_pod_item(pod, pai_pod_gauge, pai_container_gauge, pai_job_pod_gauge, pods_info):
    """ add metrics to pai_pod_gauge or pai_container_gauge if successfully parse pod.
    Because we are parsing json outputed by k8s, its format is subjected to change,
    we should test if field exists before accessing it to avoid KeyError """

    pod_name = pod["metadata"]["name"]
    namespace = walk_json_field_safe(pod, "metadata", "namespace") or "default"
    host_ip = walk_json_field_safe(pod, "status", "hostIP") or "unscheduled"
    status = pod["status"]
    containers = walk_json_field_safe(pod, "spec", "containers")
    labels = pod["metadata"].get("labels")
    node_name = walk_json_field_safe(pod, "spec", "nodeName")

    service_name = walk_json_field_safe(labels, "app")
    job_name = walk_json_field_safe(labels, "jobName")
    if service_name is None and job_name is None:
        logger.info("unknown pod %s", pod_name)
        return None

    generate_pods_info(pod_name, containers, host_ip, pods_info)
    generate_pod_metrics(pai_pod_gauge, pai_job_pod_gauge, service_name,
                         job_name, pod_name, node_name, host_ip, status, namespace)

    # generate pai_containers
    if service_name is not None and status.get("containerStatuses") is not None:
        container_statuses = status["containerStatuses"]
        generate_container_metrics(
            pai_container_gauge, service_name, pod_name, container_statuses, namespace, host_ip)


def generate_pod_metrics(pai_pod_gauge, pai_job_pod_gauge, service_name, job_name, pod_name,
                         node_name, host_ip, status, namespace):
    if status.get("phase") is not None:
        phase = status["phase"].lower()
    else:
        phase = "unknown"

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
                logger.warning("unexpected condition %s in pod %s", cond_t, pod_name)

    # used to judge if sechduler has bound pod to a certain node
    pod_bound = "true" if node_name else "false"

    if service_name is not None:
        pai_pod_gauge.add_metric([service_name, pod_name, namespace, phase, host_ip,
            initialized, pod_scheduled, ready], 1)
    if job_name is not None:
        pai_job_pod_gauge.add_metric([job_name, pod_name, phase, host_ip,
            initialized, pod_bound, pod_scheduled, ready], 1)


def generate_pods_info(pod_name, containers, host_ip, pods_info):
    used_gpu = 0
    if containers is not None:
        for container in containers:
            req_gpu = int(walk_json_field_safe(container, "resources", "requests",
                    "nvidia.com/gpu") or 0)
            limit_gpu = int(walk_json_field_safe(container, "resources", "limits",
                    "nvidia.com/gpu") or 0)
            used_gpu += max(req_gpu, limit_gpu)
    pods_info[host_ip].append(PodInfo(pod_name, used_gpu))


def generate_container_metrics(pai_container_gauge, service_name, pod_name, container_statuses,
                               namespace, host_ip):
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
                container_state = list(state.keys())[0].lower()

        pai_container_gauge.add_metric([service_name, pod_name, container_name,
            namespace, container_state, host_ip, str(ready).lower()], 1)


def process_pods_status(pods_object, pai_pod_gauge, pai_container_gauge, pai_job_pod_gauge,
        pods_info):
    def _map_fn(item):
        return catch_exception(parse_pod_item,
                "catch exception when parsing pod item",
                None,
                item,
                pai_pod_gauge, pai_container_gauge,
                pai_job_pod_gauge, pods_info)

    list(map(_map_fn, pods_object["items"]))


def collect_healthz(gauge, histogram, scheme, address, port, url, ca_path, headers):
    with histogram.time():
        error = "ok"
        try:
            error = requests.get("{}://{}:{}{}".format(scheme, address, port, url), headers = headers, verify = ca_path).text
        except Exception as e:
            error_counter.labels(type="healthz").inc()
            error = str(e)
            logger.exception("requesting %s:%d%s failed", address, port, url)

        gauge.add_metric([error, address], 1)


def collect_k8s_component(api_server_scheme, api_server_ip, api_server_port, ca_path, headers):
    k8s_gauge = gen_k8s_api_gauge()

    collect_healthz(k8s_gauge, api_healthz_histogram,
            api_server_scheme, api_server_ip, api_server_port, "/healthz", ca_path, headers)

    return [k8s_gauge]


def parse_node_item(node, pai_node_gauge,
        node_gpu_avail, node_gpu_total, node_gpu_reserved,
        pods_info):

    ip = None

    addresses = walk_json_field_safe(node, "status", "addresses")
    if addresses is not None:
        for addr in addresses:
            if addr.get("type") == "InternalIP":
                ip = addr.get("address")

    if ip is None:
        ip = node["metadata"]["name"]

    disk_pressure = memory_pressure = out_of_disk = ready = unschedulable = "unknown"

    if node.get("status") is not None:
        status = node["status"]

        conditions = walk_json_field_safe(status, "conditions")
        if conditions is not None:
            for cond in conditions:
                cond_t = cond["type"]
                node_status = cond["status"].lower()

                if cond_t == "DiskPressure":
                    disk_pressure = node_status
                elif cond_t == "MemoryPressure":
                    memory_pressure = node_status
                elif cond_t == "OutOfDisk":
                    out_of_disk = node_status
                elif cond_t == "Ready":
                    ready = node_status
                else:
                    error_counter.labels(type="unknown_node_cond").inc()
                    logger.warning("unexpected condition %s in node %s", cond_t, ip)

        # https://github.com/kubernetes/community/blob/master/contributors/design-proposals/node/node-allocatable.md
        # [Allocatable] = [Node Capacity] - [Kube-Reserved] - [System-Reserved] - [Hard-Eviction-Threshold]
        total_gpu = 0

        allocatable = walk_json_field_safe(status, "allocatable")
        if allocatable is not None:
            gpu1 = int(walk_json_field_safe(allocatable, "alpha.kubernetes.io/nvidia-gpu") or "0")
            gpu2 = int(walk_json_field_safe(allocatable, "nvidia.com/gpu") or "0")

            total_gpu = max(gpu1, gpu2)
            node_gpu_total.add_metric([ip], total_gpu)
        else:
            capacity = walk_json_field_safe(status, "capacity")
            if capacity is not None:
                gpu1 = int(walk_json_field_safe(capacity, "alpha.kubernetes.io/nvidia-gpu") or "0")
                gpu2 = int(walk_json_field_safe(capacity, "nvidia.com/gpu") or "0")
                total_gpu = max(gpu1. gpu2)

                node_gpu_total.add_metric([ip], total_gpu)

        # Because k8s api's node api do not record how much resource left for
        # allocation, so we have to compute it ourselves.
        used_gpu = 0

        if pods_info.get(ip) is not None:
            for pod in pods_info[ip]:
                used_gpu += pod.gpu

        # if a node is marked as unschedulable, the available gpu will be 0
        # and reserved gpu will be `total - used`
        if walk_json_field_safe(node, "spec", "unschedulable") != True:
            node_gpu_avail.add_metric([ip], max(0, total_gpu - used_gpu))
            node_gpu_reserved.add_metric([ip], 0)
        else:
            node_gpu_avail.add_metric([ip], 0)
            node_gpu_reserved.add_metric([ip], max(0, total_gpu - used_gpu))
    else:
        logger.warning("unexpected structure of node %s: %s", ip, json.dumps(node))

    unschedulable_s = walk_json_field_safe(node, "spec", "unschedulable")
    if unschedulable_s is True:
        unschedulable = "true"
    else:
        unschedulable = "false"

    pai_node_gauge.add_metric([ip, disk_pressure, memory_pressure, out_of_disk, ready, unschedulable], 1)


def process_nodes_status(nodes_object, pods_info):
    pai_node_gauge = gen_pai_node_gauge()
    node_gpu_avail = gen_k8s_node_gpu_available()
    node_gpu_reserved = gen_k8s_node_gpu_reserved()
    node_gpu_total = gen_k8s_node_gpu_total()

    def _map_fn(item):
        return catch_exception(parse_node_item,
                "catch exception when parsing node item",
                None,
                item,
                pai_node_gauge,
                node_gpu_avail,
                node_gpu_total,
                node_gpu_reserved,
                pods_info)

    list(map(_map_fn, nodes_object["items"]))

    return [pai_node_gauge,
            node_gpu_avail, node_gpu_total, node_gpu_reserved]


def process_pods(k8s_api_addr, ca_path, headers, pods_info):
    list_pods_url = "{}/api/v1/pods".format(k8s_api_addr)

    pai_pod_gauge = gen_pai_pod_gauge()
    pai_container_gauge = gen_pai_container_gauge()
    pai_job_pod_gauge = gen_pai_job_pod_gauge()

    try:
        pods_object = request_with_histogram(list_pods_url, list_pods_histogram,
                ca_path, headers)
        process_pods_status(pods_object, pai_pod_gauge, pai_container_gauge, pai_job_pod_gauge,
                pods_info)
    except Exception as e:
        error_counter.labels(type="parse").inc()
        logger.exception("failed to process pods from namespace %s", ns)

    return [pai_pod_gauge, pai_container_gauge, pai_job_pod_gauge]


def process_nodes(k8s_api_addr, ca_path, headers, pods_info):
    list_nodes_url = "{}/api/v1/nodes/".format(k8s_api_addr)

    nodes_object = request_with_histogram(list_nodes_url, list_nodes_histogram,
            ca_path, headers)

    return process_nodes_status(nodes_object, pods_info)


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
            logger.warning("can not remove old prom file %s", path)

def register_stack_trace_dump():
    faulthandler.register(signal.SIGTRAP, all_threads=True, chain=False)

 # https://github.com/prometheus/client_python/issues/322#issuecomment-428189291
def burninate_gc_collector():
    for callback in gc.callbacks[:]:
        if callback.__qualname__.startswith("GCCollector."):
            gc.callbacks.remove(callback)

    for name, collector in list(prometheus_client.REGISTRY._names_to_collectors.items()):
        if name.startswith("python_gc_"):
            try:
                prometheus_client.REGISTRY.unregister(collector)
            except KeyError:  # probably gone already
                pass

class HealthResource(Resource):
    def render_GET(self, request):
        request.setHeader("Content-Type", "text/html; charset=utf-8")
        return "<html>Ok</html>".encode("utf-8")


def get_apiserver_address():
    apiserver_addr = os.environ.get(KUBE_APISERVER_ADDRESS)
    if apiserver_addr:
        return apiserver_addr
    if (not os.environ.get(KUBE_INCLUSTER_HOST) or not os.environ.get(KUBE_INCLUSTER_PORT)):
        raise Exception("Counld not get api server address")
    return "https://{}:{}".format(os.environ.get(KUBE_INCLUSTER_HOST), os.environ.get(KUBE_INCLUSTER_PORT))
    

def main(args):
    register_stack_trace_dump()
    burninate_gc_collector()
    log_dir = args.log

    try_remove_old_prom_file(log_dir + "/watchdog.prom")

    atomic_ref = AtomicRef()
    address = get_apiserver_address()

    t = threading.Thread(target=loop, name="loop", args=(address, args, atomic_ref))
    t.daemon = True
    t.start()

    REGISTRY.register(CustomCollector(atomic_ref))

    root = Resource()
    root.putChild(b"metrics", MetricsResource())
    root.putChild(b"healthz", HealthResource())

    factory = Site(root)
    reactor.listenTCP(int(args.port), factory)
    reactor.run()


def loop(address, args, atomic_ref):
    parse_result = urllib.parse.urlparse(address)
    api_server_scheme = parse_result.scheme
    api_server_ip = parse_result.hostname
    api_server_port = parse_result.port or 80

    ca_path = args.ca
    bearer_path = args.bearer
    if (ca_path is None and bearer_path is not None) or (ca_path is not None and bearer_path is None):
        logger.warning("please provide bearer_path and ca_path at the same time or not")

    headers = None
    if not os.path.isfile(ca_path):
        ca_path = None
    if not os.path.isfile(bearer_path):
        bearer_path = None
    if bearer_path is not None:
        with open(bearer_path, 'r') as bearer_file:
           bearer = bearer_file.read()
           headers = {'Authorization': "Bearer {}".format(bearer)}

    while True:
        result = []
        try:
            pods_info = collections.defaultdict(lambda : [])

            result.extend(process_pods(address, ca_path, headers, pods_info))

            result.extend(process_nodes(address, ca_path, headers, pods_info))

            result.extend(collect_k8s_component(api_server_scheme, api_server_ip, api_server_port, ca_path, headers))
        except Exception as e:
            error_counter.labels(type="unknown").inc()
            logger.exception("watchdog failed in one iteration")

        atomic_ref.get_and_set(result)

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
    parser.add_argument("--log", "-l", help="log dir to store log", default="/datastorage/prometheus")
    parser.add_argument("--interval", "-i", help="interval between two collection", default="30")
    parser.add_argument("--port", "-p", help="port to expose metrics", default="9101")
    parser.add_argument("--ca", "-c", help="ca file path")
    parser.add_argument("--bearer", "-b", help="bearer token file path")
    args = parser.parse_args()

    logging.basicConfig(format="%(asctime)s - %(levelname)s - %(filename)s:%(lineno)s - %(message)s",
            level=get_logging_level())

    main(args)
