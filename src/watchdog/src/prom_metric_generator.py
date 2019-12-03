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

import logging

from prometheus_client import Counter, Histogram
from prometheus_client.core import GaugeMetricFamily

from collector import Collector
import utils

LOGGER = logging.getLogger(__name__)

##### watchdog will generate following metrics
# Document about these metrics is in `prometheus/doc/watchdog-metrics.md`

_ERROR_COUNTER = Counter("process_error_log_total", "total count of error log",
                         ["type"])

_API_HEALTHZ_HISTOGRAM = Histogram(
    "k8s_api_healthz_resp_latency_seconds",
    "Response latency for requesting k8s api healthz (seconds)")

# use `histogram_quantile(0.95, sum(rate(k8s_api_list_pods_latency_seconds_bucket[5m])) by (le))`
# to get 95 percentile latency in past 5 miniute.
_LIST_PODS_HISTOGRAM = Histogram(
    "k8s_api_list_pods_latency_seconds",
    "Response latency for list pods from k8s api (seconds)")

_LIST_NODES_HISTOGRAM = Histogram(
    "k8s_api_list_nodes_latency_seconds",
    "Response latency for list nodes from k8s api (seconds)")


def _gen_pai_pod_gauge():
    return GaugeMetricFamily("pai_pod_count",
                             "count of pai pod",
                             labels=[
                                 "service_name", "name", "namespace", "phase",
                                 "host_ip", "initialized", "pod_scheduled",
                                 "ready"
                             ])


def _gen_pai_job_pod_gauge():
    return GaugeMetricFamily("pai_job_pod_count",
                             "count of pai job pod",
                             labels=[
                                 "job_name", "name", "phase", "host_ip",
                                 "initialized", "pod_bound", "pod_scheduled",
                                 "ready"
                             ])


def _gen_pai_container_gauge():
    return GaugeMetricFamily("pai_container_count",
                             "count of container pod",
                             labels=[
                                 "service_name", "pod_name", "name",
                                 "namespace", "state", "host_ip", "ready"
                             ])


def _gen_pai_node_gauge():
    return GaugeMetricFamily("pai_node_count",
                             "count of pai node",
                             labels=[
                                 "name", "disk_pressure", "memory_pressure",
                                 "out_of_disk", "ready", "unschedulable"
                             ])


def _gen_k8s_api_gauge():
    return GaugeMetricFamily("k8s_api_server_count",
                             "count of k8s api server",
                             labels=["error", "host_ip"])


def _gen_k8s_node_gpu_available():
    return GaugeMetricFamily("k8s_node_gpu_available",
                             "gpu available on k8s node",
                             labels=["host_ip"])


def _gen_k8s_node_gpu_reserved():
    # reserved gpu means gpu not allocated to tasks and the node is being marked as
    # unschedulable.
    return GaugeMetricFamily("k8s_node_gpu_reserved",
                             "gpu reserved on k8s node",
                             labels=["host_ip"])


def _gen_k8s_node_gpu_total():
    return GaugeMetricFamily("k8s_node_gpu_total",
                             "gpu total on k8s node",
                             labels=["host_ip"])


def catch_exception(msg, error_type="parse", default=None):
    """ catch_exception decorator used to count errors occur in watchdog """
    def decorator(func):
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception:  #pylint: disable=broad-except
                _ERROR_COUNTER.labels(type=error_type).inc()
                LOGGER.exception(msg)
                return default

        return wrapper

    return decorator


class PodInfo(object):
    def __init__(self, name, gpu):
        self.name = name
        self.gpu = gpu

    def __repr__(self):
        return "%s: %s" % (self.name, self.gpu)


class PromMetricGenerator:
    def __init__(self):
        self._collector = Collector()

    def _generate_pod_metrics(self, pai_pod_gauge, pai_job_pod_gauge,
                              service_name, job_name, pod_name, node_name,
                              host_ip, status, namespace):
        if status.phase is not None:
            phase = status.phase.lower()
        else:
            phase = "unknown"

        initialized = pod_scheduled = ready = "unknown"

        conditions = status.conditions
        if conditions is not None:
            for cond in conditions:
                cond_t = cond.type  # Initialized|Ready|PodScheduled
                cond_status = cond.status.lower()

                if cond_t == "Initialized":
                    initialized = cond_status
                elif cond_t == "PodScheduled":
                    pod_scheduled = cond_status
                elif cond_t == "Ready":
                    ready = cond_status
                else:
                    _ERROR_COUNTER.labels(type="unknown_pod_cond").inc()
                    LOGGER.warning("unexpected condition %s in pod %s", cond_t,
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

    def _generate_pods_info(self, pod_name, containers, host_ip, pods_info):
        used_gpu = 0
        if containers is not None:
            for container in containers:
                req_gpu = int(
                    utils.walk_json_field_safe(container.resources, "requests",
                                               "nvidia.com/gpu") or 0)
                limit_gpu = int(
                    utils.walk_json_field_safe(container.resources, "limits",
                                               "nvidia.com/gpu") or 0)
                used_gpu += max(req_gpu, limit_gpu)
        pods_info[host_ip].append(PodInfo(pod_name, used_gpu))

    def _generate_container_metrics(self, pai_container_gauge, service_name,
                                    pod_name, container_statuses, namespace,
                                    host_ip):
        for container_status in container_statuses:
            container_name = container_status.name
            ready = False

            if container_status.ready is not None:
                ready = container_status.ready

            container_state = None
            if container_status.state is not None:
                state = container_status.state
                if state.running:
                    container_state = "running"
                if state.terminated:
                    container_state = "terminated"
                else:
                    container_state = "waiting"

            pai_container_gauge.add_metric([
                service_name, pod_name, container_name, namespace,
                container_state, host_ip,
                str(ready).lower()
            ], 1)

    def _parse_pod_item(self, pod, pai_pod_gauge, pai_container_gauge,
                        pai_job_pod_gauge, pods_info) -> None:
        """ add metrics to pai_pod_gauge or pai_container_gauge if successfully parse pod.
        Because we are parsing json outputed by k8s, its format is subjected to change,
        we should test if field exists before accessing it to avoid KeyError """

        pod_name = pod.metadata.name
        namespace = pod.metadata.namespace or "default"
        host_ip = pod.status.host_ip or "unscheduled"
        status = pod.status
        containers = pod.spec.containers
        labels = pod.metadata.labels
        node_name = pod.spec.node_name

        service_name = utils.walk_json_field_safe(labels, "app")
        job_name = utils.walk_json_field_safe(labels, "jobName")
        if service_name is None and job_name is None:
            LOGGER.info("unknown pod %s", pod_name)
            return None

        self._generate_pods_info(pod_name, containers, host_ip, pods_info)
        self._generate_pod_metrics(pai_pod_gauge, pai_job_pod_gauge,
                                   service_name, job_name, pod_name, node_name,
                                   host_ip, status, namespace)

        # generate pai_containers
        if service_name is not None and status.container_statuses is not None:
            container_statuses = status.container_statuses
            self._generate_container_metrics(pai_container_gauge, service_name,
                                             pod_name, container_statuses,
                                             namespace, host_ip)

    def _process_pods_status(self, pods_object, pods_info):
        pai_pod_gauge = _gen_pai_pod_gauge()
        pai_container_gauge = _gen_pai_container_gauge()
        pai_job_pod_gauge = _gen_pai_job_pod_gauge()

        @catch_exception(msg="catch exception when parsing pod item")
        def _map_fn(item):
            return self._parse_pod_item(item, pai_pod_gauge,
                                        pai_container_gauge, pai_job_pod_gauge,
                                        pods_info)

        list(map(_map_fn, pods_object.items))
        return [pai_pod_gauge, pai_container_gauge, pai_job_pod_gauge]

    def _get_node_status(self, conditions, node_ip):
        disk_pressure = memory_pressure = out_of_disk = ready = unschedulable = "unknown"
        if not conditions:
            return [
                disk_pressure, memory_pressure, out_of_disk, ready,
                unschedulable
            ]
        for cond in conditions:
            cond_t = cond.type
            node_status = cond.status.lower()

            if cond_t == "DiskPressure":
                disk_pressure = node_status
            elif cond_t == "MemoryPressure":
                memory_pressure = node_status
            elif cond_t == "OutOfDisk":
                out_of_disk = node_status
            elif cond_t == "Ready":
                ready = node_status
            else:
                _ERROR_COUNTER.labels(type="unknown_node_cond").inc()
                LOGGER.warning("unexpected condition %s in node %s", cond_t,
                               node_ip)
        return [
            disk_pressure, memory_pressure, out_of_disk, ready, unschedulable
        ]

    def _parse_node_item(self, node, pai_node_gauge, node_gpu_avail,
                         node_gpu_total, node_gpu_reserved, pods_info):
        ip = None
        addresses = node.status.addresses
        if not addresses:
            for addr in addresses:
                if addr.type == "InternalIP":
                    ip = addr.address
        ip = node.metadata.name if not ip else ip

        if not node.status:
            status = node.status
            conditions = status.conditions
            disk_pressure, memory_pressure, out_of_disk, ready, unschedulable = self._get_node_status(
                conditions, ip)

            # https://github.com/kubernetes/community/blob/master/contributors/design-proposals/node/node-allocatable.md
            # [Allocatable] = [Node Capacity] - [Kube-Reserved] - [System-Reserved] - [Hard-Eviction-Threshold]
            total_gpu = 0
            allocatable = status.allocatable
            if allocatable:
                gpu1 = int(
                    utils.walk_json_field_safe(
                        allocatable, "alpha.kubernetes.io/nvidia-gpu") or "0")
                gpu2 = int(
                    utils.walk_json_field_safe(allocatable, "nvidia.com/gpu")
                    or "0")

                total_gpu = max(gpu1, gpu2)
                node_gpu_total.add_metric([ip], total_gpu)
            else:
                capacity = status.capacity
                if capacity:
                    gpu1 = int(
                        utils.walk_json_field_safe(
                            capacity, "alpha.kubernetes.io/nvidia-gpu") or "0")
                    gpu2 = int(
                        utils.walk_json_field_safe(capacity, "nvidia.com/gpu")
                        or "0")
                    total_gpu = max(gpu1, gpu2)

                    node_gpu_total.add_metric([ip], total_gpu)

            # Because k8s api's node api do not record how much resource left for
            # allocation, so we have to compute it ourselves.
            used_gpu = 0
            if pods_info.get(ip):
                for pod in pods_info[ip]:
                    used_gpu += pod.gpu

            # if a node is marked as unschedulable, the available gpu will be 0
            # and reserved gpu will be `total - used`
            if not node.spec.unschedulable:
                node_gpu_avail.add_metric([ip], max(0, total_gpu - used_gpu))
                node_gpu_reserved.add_metric([ip], 0)
            else:
                node_gpu_avail.add_metric([ip], 0)
                node_gpu_reserved.add_metric([ip], max(0,
                                                       total_gpu - used_gpu))
        else:
            LOGGER.warning("unexpected structure of node %s: %s", ip, node)

        unschedulable = node.spec.unschedulable.lower(
        ) if node.spec.unschedulable else False

        pai_node_gauge.add_metric([
            ip, disk_pressure, memory_pressure, out_of_disk, ready,
            unschedulable
        ], 1)

    def _process_nodes_status(self, nodes_object, pods_info):
        pai_node_gauge = _gen_pai_node_gauge()
        node_gpu_avail = _gen_k8s_node_gpu_available()
        node_gpu_reserved = _gen_k8s_node_gpu_reserved()
        node_gpu_total = _gen_k8s_node_gpu_total()

        @catch_exception(msg="catch exception when parsing node item")
        def _map_fn(item):
            return self._parse_node_item(item, pai_node_gauge, node_gpu_avail,
                                         node_gpu_total, node_gpu_reserved,
                                         pods_info)

        list(map(_map_fn, nodes_object.items))

        return [
            pai_node_gauge, node_gpu_avail, node_gpu_total, node_gpu_reserved
        ]

    @catch_exception(msg="failed to process pods")
    def generate_pods_metrics(self, pods_info):
        with _LIST_PODS_HISTOGRAM.time():
            pods_objects = self._collector.collect_pods_info()
        return self._process_pods_status(pods_objects, pods_info)

    @catch_exception(msg="failed to process nodes")
    def generate_nodes_metrics(self, pods_info):
        with _LIST_NODES_HISTOGRAM.time():
            nodes_object = self._collector.collect_nodes_info()
        return self._process_nodes_status(nodes_object, pods_info)

    @catch_exception(msg="failed to query health")
    def generate_k8s_component_health_metrics(self):
        k8s_gauge = _gen_k8s_api_gauge()
        with _API_HEALTHZ_HISTOGRAM.time():
            error = self._collector.collect_api_server_health()
        k8s_gauge.add_metric(
            [error, self._collector.get_kube_api_server_hotname()], 1)
        return [k8s_gauge]

    def add_error_counter(self, error_type):
        _ERROR_COUNTER.labels(type=error_type).inc()
