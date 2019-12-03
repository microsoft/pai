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
import collections
import faulthandler
import logging
import os
import signal
import sys
import time
import threading

import prometheus_client
from prometheus_client.twisted import MetricsResource
from twisted.internet import reactor
from twisted.web.resource import Resource
from twisted.web.server import Site

#pylint: disable=wrong-import-position
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__))))
from prom_metric_generator import PromMetricGenerator
#pylint: enable=wrong-import-position

LOGGER = logging.getLogger(__name__)


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
            sys.stderr.write("unknown logging level " + level +
                             ", default to INFO\n")
            result = logging.INFO

    return result


def try_remove_old_prom_file(path) -> None:
    """ try to remove old prom file, since old prom file are exposed by node-exporter,
    if we do not remove, node-exporter will still expose old metrics """
    if os.path.isfile(path):
        try:
            os.remove(path)
        except OSError:
            LOGGER.warning("can not remove old prom file %s",
                           path,
                           exc_info=True)


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


class HealthResource(Resource):
    def render_GET(self, request) -> bytes:
        request.setHeader("Content-Type", "text/html; charset=utf-8")
        return "<html>Ok</html>".encode("utf-8")


class CustomCollector(object):
    def __init__(self, atomic_ref):
        self.atomic_ref = atomic_ref

    def collect(self):
        data = self.atomic_ref.get()

        if data is not None:
            for datum in data:
                yield datum
        else:
            return
            yield


def catch_exception(fn, msg, default, *args, **kwargs):
    """ wrap fn call with try catch, makes watchdog more robust """
    try:
        return fn(*args, **kwargs)
    except Exception:
        error_counter.labels(type="parse").inc()
        logger.exception(msg)
        return default


class PodInfo(object):
    def __init__(self, name, gpu):
        self.name = name
        self.gpu = gpu

    def __repr__(self):
        return "%s: %s" % (self.name, self.gpu)


def parse_pod_item(pod, pai_pod_gauge, pai_container_gauge, pai_job_pod_gauge,
                   pods_info):
    """ add metrics to pai_pod_gauge or pai_container_gauge if successfully parse pod.
    Because we are parsing json outputted by k8s, its format is subjected to change,
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
                         job_name, pod_name, node_name, host_ip, status,
                         namespace)

    # generate pai_containers
    if service_name is not None and status.get(
            "containerStatuses") is not None:
        container_statuses = status["containerStatuses"]
        generate_container_metrics(pai_container_gauge, service_name, pod_name,
                                   container_statuses, namespace, host_ip)


def generate_pod_metrics(pai_pod_gauge, pai_job_pod_gauge, service_name,
                         job_name, pod_name, node_name, host_ip, status,
                         namespace):
    if status.get("phase") is not None:
        phase = status["phase"].lower()
    else:
        phase = "unknown"

    initialized = pod_scheduled = ready = "unknown"

    conditions = status.get("conditions")
    if conditions is not None:
        for cond in conditions:
            cond_t = cond["type"]  # Initialized|Ready|PodScheduled
            cond_status = cond["status"].lower()

            if cond_t == "Initialized":
                initialized = cond_status
            elif cond_t == "PodScheduled":
                pod_scheduled = cond_status
            elif cond_t == "Ready":
                ready = cond_status
            else:
                error_counter.labels(type="unknown_pod_cond").inc()
                logger.warning("unexpected condition %s in pod %s", cond_t,
                               pod_name)

    # used to judge if sechduler has bound pod to a certain node
    pod_bound = "true" if node_name else "false"

    if service_name is not None:
        pai_pod_gauge.add_metric([
            service_name, pod_name, namespace, phase, host_ip, initialized,
            pod_scheduled, ready
        ], 1)
    if job_name is not None:
        pai_job_pod_gauge.add_metric([
            job_name, pod_name, phase, host_ip, initialized, pod_bound,
            pod_scheduled, ready
        ], 1)


def generate_pods_info(pod_name, containers, host_ip, pods_info):
    used_gpu = 0
    if containers is not None:
        for container in containers:
            req_gpu = int(
                walk_json_field_safe(container, "resources", "requests",
                                     "nvidia.com/gpu") or 0)
            limit_gpu = int(
                walk_json_field_safe(container, "resources", "limits",
                                     "nvidia.com/gpu") or 0)
            used_gpu += max(req_gpu, limit_gpu)
    pods_info[host_ip].append(PodInfo(pod_name, used_gpu))


def generate_container_metrics(pai_container_gauge, service_name, pod_name,
                               container_statuses, namespace, host_ip):
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

        pai_container_gauge.add_metric([
            service_name, pod_name, container_name, namespace, container_state,
            host_ip,
            str(ready).lower()
        ], 1)


def process_pods_status(pods_object, pai_pod_gauge, pai_container_gauge,
                        pai_job_pod_gauge, pods_info):
    def _map_fn(item):
        return catch_exception(parse_pod_item,
                               "catch exception when parsing pod item", None,
                               item, pai_pod_gauge, pai_container_gauge,
                               pai_job_pod_gauge, pods_info)

    list(map(_map_fn, pods_object["items"]))


def collect_healthz(gauge, histogram, scheme, address, port, url, ca_path,
                    headers):
    with histogram.time():
        error = "ok"
        try:
            error = requests.get("{}://{}:{}{}".format(scheme, address, port,
                                                       url),
                                 headers=headers,
                                 verify=ca_path).text
        except Exception as e:
            error_counter.labels(type="healthz").inc()
            error = str(e)
            logger.exception("requesting %s:%d%s failed", address, port, url)

        gauge.add_metric([error, address], 1)


def collect_k8s_component(api_server_scheme, api_server_ip, api_server_port,
                          ca_path, headers):
    k8s_gauge = gen_k8s_api_gauge()

    collect_healthz(k8s_gauge, api_healthz_histogram, api_server_scheme,
                    api_server_ip, api_server_port, "/healthz", ca_path,
                    headers)

    return [k8s_gauge]


def parse_node_item(node, pai_node_gauge, node_gpu_avail, node_gpu_total,
                    node_gpu_reserved, pods_info):

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
                    logger.warning("unexpected condition %s in node %s",
                                   cond_t, ip)

        # https://github.com/kubernetes/community/blob/master/contributors/design-proposals/node/node-allocatable.md
        # [Allocatable] = [Node Capacity] - [Kube-Reserved] - [System-Reserved] - [Hard-Eviction-Threshold]
        total_gpu = 0

        allocatable = walk_json_field_safe(status, "allocatable")
        if allocatable is not None:
            gpu1 = int(
                walk_json_field_safe(allocatable,
                                     "alpha.kubernetes.io/nvidia-gpu") or "0")
            gpu2 = int(
                walk_json_field_safe(allocatable, "nvidia.com/gpu") or "0")

            total_gpu = max(gpu1, gpu2)
            node_gpu_total.add_metric([ip], total_gpu)
        else:
            capacity = walk_json_field_safe(status, "capacity")
            if capacity is not None:
                gpu1 = int(
                    walk_json_field_safe(
                        capacity, "alpha.kubernetes.io/nvidia-gpu") or "0")
                gpu2 = int(
                    walk_json_field_safe(capacity, "nvidia.com/gpu") or "0")
                total_gpu = max(gpu1, gpu2)

                node_gpu_total.add_metric([ip], total_gpu)

        # Because k8s api's node api do not record how much resource left for
        # allocation, so we have to compute it ourselves.
        used_gpu = 0

        if pods_info.get(ip) is not None:
            for pod in pods_info[ip]:
                used_gpu += pod.gpu

        # if a node is marked as unschedulable, the available gpu will be 0
        # and reserved gpu will be `total - used`
        if not walk_json_field_safe(node, "spec", "unschedulable"):
            node_gpu_avail.add_metric([ip], max(0, total_gpu - used_gpu))
            node_gpu_reserved.add_metric([ip], 0)
        else:
            node_gpu_avail.add_metric([ip], 0)
            node_gpu_reserved.add_metric([ip], max(0, total_gpu - used_gpu))
    else:
        logger.warning("unexpected structure of node %s: %s", ip,
                       json.dumps(node))

    unschedulable_s = walk_json_field_safe(node, "spec", "unschedulable")
    if unschedulable_s is True:
        unschedulable = "true"
    else:
        unschedulable = "false"

    pai_node_gauge.add_metric([
        ip, disk_pressure, memory_pressure, out_of_disk, ready, unschedulable
    ], 1)


def process_nodes_status(nodes_object, pods_info):
    pai_node_gauge = gen_pai_node_gauge()
    node_gpu_avail = gen_k8s_node_gpu_available()
    node_gpu_reserved = gen_k8s_node_gpu_reserved()
    node_gpu_total = gen_k8s_node_gpu_total()


def metric_collection_loop(atomic_ref, interval):
    metric_generator = PromMetricGenerator()
    while True:
        result = []
        try:
            pods_info = collections.defaultdict(lambda: [])
            result.extend(metric_generator.generate_pods_metrics(pods_info))
            result.extend(metric_generator.generate_nodes_metrics(pods_info))
            result.extend(
                metric_generator.generate_k8s_component_health_metrics())
        except Exception:  #pylint: disable=broad-except
            metric_generator.add_error_counter(error_type="unknown")
            LOGGER.exception("watchdog failed in one iteration")

        atomic_ref.get_and_set(result)
        time.sleep(float(interval))


def start_watchdog(args) -> None:
    LOGGER.info("Watchdog Sarting")
    log_dir = args.log
    interval = args.interval
    try_remove_old_prom_file(log_dir)
    atomic_ref = AtomicRef()

    thread = threading.Thread(target=metric_collection_loop,
                              name="metric_collotion_loop",
                              args=(atomic_ref, interval),
                              daemon=True)
    thread.start()

    prometheus_client.REGISTRY.register(CustomCollector(atomic_ref))

    root = Resource()
    root.putChild(b"metrics", MetricsResource())
    root.putChild(b"healthz", HealthResource())

    factory = Site(root)
    reactor.listenTCP(int(args.port), factory)
    reactor.run()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--log",
                        "-l",
                        help="log dir to store log",
                        default="/datastorage/prometheus")
    parser.add_argument("--interval",
                        "-i",
                        help="interval between two collection",
                        default="30")
    parser.add_argument("--port",
                        "-p",
                        help="port to expose metrics",
                        default="9101")
    args = parser.parse_args()
    logging.basicConfig(
        format=
        "%(asctime)s - %(levelname)s - %(filename)s:%(lineno)s - %(message)s",
        level=get_logging_level())

    faulthandler.register(signal.SIGTRAP, all_threads=True, chain=False)
    start_watchdog(args)


if __name__ == "__main__":
    main()
