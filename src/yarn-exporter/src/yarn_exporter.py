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
# BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
# DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import urllib.parse
import argparse
import signal
import faulthandler
import gc
import logging
import os
import sys
from collections import defaultdict

from prometheus_client.core import GaugeMetricFamily, REGISTRY
from prometheus_client import Histogram
from prometheus_client.twisted import MetricsResource

import requests

from twisted.web.server import Site
from twisted.web.resource import Resource
from twisted.internet import reactor

logger = logging.getLogger(__name__)

##### yarn-exporter will generate following metrics

cluster_scheduler_histogram = Histogram("yarn_api_cluster_scheduler_latency_seconds",
        "Resource latency for requesting yarn api /ws/v1/cluster/scheduler")

cluster_nodes_histogram = Histogram("yarn_api_cluster_nodes_latency_seconds",
        "Resource latency for requesting yarn api /ws/v1/cluster/nodes")

def gen_active_node_count():
    return GaugeMetricFamily("yarn_nodes_active", "active node count in yarn")

def gen_queue_cpu_available():
    return GaugeMetricFamily("yarn_queue_cpu_available", "available cpu in queue",
            labels=["queue"])

def gen_queue_cpu_cap():
    return GaugeMetricFamily("yarn_queue_cpu_total", "total cpu in queue",
            labels=["queue"])

def gen_queue_mem_available():
    return GaugeMetricFamily("yarn_queue_mem_available", "available mem in queue",
            labels=["queue"])

def gen_queue_mem_cap():
    return GaugeMetricFamily("yarn_queue_mem_total", "total mem in queue",
            labels=["queue"])

def gen_queue_gpu_available():
    return GaugeMetricFamily("yarn_queue_gpu_available", "available gpu in queue",
            labels=["queue"])

def gen_queue_gpu_cap():
    return GaugeMetricFamily("yarn_queue_gpu_total", "total gpu in queue",
            labels=["queue"])

def gen_queue_running_jobs():
    return GaugeMetricFamily("yarn_queue_running_job", "total running job count in queue",
            labels=["queue"])

def gen_queue_pending_jobs():
    return GaugeMetricFamily("yarn_queue_pending_job", "total pending job count in queue",
            labels=["queue"])

def gen_queue_running_containers():
    return GaugeMetricFamily("yarn_queue_running_container", "total running container count in queue",
            labels=["queue"])

def gen_queue_pending_containers():
    return GaugeMetricFamily("yarn_queue_pending_container", "total pending container count in queue",
            labels=["queue"])

def gen_node_cpu_total():
    return GaugeMetricFamily("yarn_node_cpu_total", "total cpu core in node",
            labels=["node_ip"])

def gen_node_cpu_available():
    return GaugeMetricFamily("yarn_node_cpu_available", "available cpu core in node",
            labels=["node_ip"])

def gen_node_mem_total():
    return GaugeMetricFamily("yarn_node_mem_total", "total mem in node",
            labels=["node_ip"])

def gen_node_mem_available():
    return GaugeMetricFamily("yarn_node_mem_available", "available mem in node",
            labels=["node_ip"])

def gen_node_gpu_total():
    return GaugeMetricFamily("yarn_node_gpu_total", "total gpu in node",
            labels=["node_ip"])

def gen_node_gpu_available():
    return GaugeMetricFamily("yarn_node_gpu_available", "available gpu in node",
            labels=["node_ip"])

def gen_yarn_exporter_error():
    return GaugeMetricFamily("yarn_exporter_error_count", "error count yarn exporter encountered",
            labels=["error"])

##### yarn-exporter will generate above metrics

def request_with_histogram(url, histogram, *args, **kwargs):
    with histogram.time():
        return requests.get(url, *args, **kwargs)

class ResourceItem(object):
    def __init__(self, cpu=0, mem=0, gpu=0):
        self.cpu = cpu
        self.mem = mem
        self.gpu = gpu

    def __add__(self, other):
        if isinstance(other, ResourceItem):
            cpu = self.cpu + other.cpu
            gpu = self.gpu + other.gpu
            mem = self.mem + other.mem
            return ResourceItem(cpu=cpu, gpu=gpu, mem=mem)
        else:
            raise NotImplemented

    def __radd__(self, other):
        return self + other

    def __sub__(self, other):
        if isinstance(other, ResourceItem):
            cpu = self.cpu - other.cpu
            gpu = self.gpu - other.gpu
            mem = self.mem - other.mem
            return ResourceItem(cpu=cpu, gpu=gpu, mem=mem)
        else:
            raise NotImplemented

    def __mul__(self, other):
        if isinstance(other, (int, float)):
            cpu = self.cpu * other
            gpu = self.gpu * other
            mem = self.mem * other
            return ResourceItem(cpu=cpu, gpu=gpu, mem=mem)
        else:
            raise NotImplemented

    def __rmul__(self, other):
        return self * other

    def __truediv__(self, other):
        if isinstance(other, (int, float)):
            cpu = self.cpu / other
            gpu = self.gpu / other
            mem = self.mem / other
            return ResourceItem(cpu=cpu, gpu=gpu, mem=mem)
        else:
            raise NotImplemented

    def __repr__(self):
        return '<cpu: {}, gpu: {}, mem: {}>'.format(self.cpu, self.gpu, self.mem)

    def __str__(self):
        return '<cpu: {}, gpu: {}, mem: {}>'.format(self.cpu, self.gpu, self.mem)

    def __eq__(self, other):
        if isinstance(other, ResourceItem):
            return self.cpu == other.cpu and self.gpu == other.gpu and self.mem == other.mem
        else:
            raise NotImplemented


class NodeCount(object):
    def __init__(self, total=0, active=0):
        self.total = total
        self.active = active


class YarnCollector(object):
    def __init__(self, yarn_url):
        self.nodes_url = urllib.parse.urljoin(yarn_url, "/ws/v1/cluster/nodes")
        self.scheduler_url = urllib.parse.urljoin(yarn_url, "/ws/v1/cluster/scheduler")

    def collect(self):
        error_counter = gen_yarn_exporter_error()

        response = None

        # nodes_url
        try:
            response = request_with_histogram(self.nodes_url, cluster_nodes_histogram,
                    allow_redirects=True)
        except Exception as e:
            error_counter.add_metric([str(e)], 1)
            logger.exception(e)

        node_count = NodeCount()

        labeled_resource = defaultdict(ResourceItem)

        if response is not None:
            if response.status_code != 200:
                msg = "requesting %s with code %d" % (self.nodes_url, response.status_code)
                logger.warning(msg)
                error_counter.add_metric([msg], 1)
            else:
                try:
                    metrics = YarnCollector.gen_nodes_metrics(response.json(),
                            node_count, labeled_resource)
                    for metric in metrics:
                        yield metric
                except Exception as e:
                    error_counter.add_metric([str(e)], 1)
                    logger.exception(e)

        nodes_active = gen_active_node_count()
        nodes_active.add_metric([], node_count.active)
        yield nodes_active

        # scheduler_url
        response = None
        try:
            response = request_with_histogram(self.scheduler_url, cluster_scheduler_histogram,
                    allow_redirects=True)
        except Exception as e:
            error_counter.add_metric([str(e)], 1)
            logger.exception(e)

        if response is not None:
            if response.status_code != 200:
                msg = "requesting %s with code %d" % (self.scheduler_url, response.status_code)
                logger.warning(msg)
                error_counter.add_metric([msg], 1)
            else:
                try:
                    metrics = YarnCollector.gen_scheduler_metrics(response.json(),
                            labeled_resource)
                    for metric in metrics:
                        yield metric
                except Exception as e:
                    error_counter.add_metric([str(e)], 1)
                    logger.exception(e)

        yield error_counter

    @staticmethod
    def gen_nodes_metrics(obj, node_count, labeled_resource):
        if obj["nodes"] is None:
            return []

        nodes = obj["nodes"]["node"]

        node_total_cpu = gen_node_cpu_total()
        node_avail_cpu = gen_node_cpu_available()
        node_total_mem = gen_node_mem_total()
        node_avail_mem = gen_node_mem_available()
        node_total_gpu = gen_node_gpu_total()
        node_avail_gpu = gen_node_gpu_available()

        total_node = active_node = 0

        for node in nodes:
            total_node += 1
            if node["state"] not in {"RUNNING", "DECOMMISSIONING"}:
                continue
            active_node += 1

            total_cpu = node["usedVirtualCores"] + node["availableVirtualCores"]
            avail_cpu = node["availableVirtualCores"]
            total_mem = (node["usedMemoryMB"] + node["availMemoryMB"]) * 1024 * 1024
            avail_mem = node["availMemoryMB"] * 1024 * 1024

            ip = node["nodeHostName"]
            node_total_cpu.add_metric([ip],
                    node["usedVirtualCores"] + node["availableVirtualCores"])
            node_avail_cpu.add_metric([ip], node["availableVirtualCores"])
            node_total_mem.add_metric([ip],
                    (node["availMemoryMB"] + node["usedMemoryMB"]) * 1024 * 1024)
            node_avail_mem.add_metric([ip], node["availMemoryMB"] * 1024 * 1024)
            if node.get("availableGPUs") is None and node.get("usedGPUs") is None:
                continue

            total_gpu = node["availableGPUs"] + node["usedGPUs"]
            avail_gpu = node["availableGPUs"]

            node_total_gpu.add_metric([ip], node["availableGPUs"] + node["usedGPUs"])
            node_avail_gpu.add_metric([ip], node["availableGPUs"])

            node_label = node.get("nodeLabels", [""])[0]

            labeled_resource[node_label] += ResourceItem(cpu=total_cpu, mem=total_mem, gpu=total_gpu)

        node_count.total = total_node
        node_count.active = active_node

        return [node_total_cpu, node_avail_cpu,
                node_total_mem, node_avail_mem,
                node_total_gpu, node_avail_gpu]

    @staticmethod
    def gen_scheduler_metrics(obj, labeled_resource):
        if obj["scheduler"] is None:
            return []

        scheduler_info = obj["scheduler"]["schedulerInfo"]

        cpu_cap = gen_queue_cpu_cap()
        cpu_avail = gen_queue_cpu_available()
        mem_cap = gen_queue_mem_cap()
        mem_avail = gen_queue_mem_available()
        gpu_cap = gen_queue_gpu_cap()
        gpu_avail = gen_queue_gpu_available()

        running_jobs = gen_queue_running_jobs()
        pending_jobs = gen_queue_pending_jobs()
        running_containers = gen_queue_running_containers()
        pending_containers = gen_queue_pending_containers()

        for queue in scheduler_info["queues"]["queue"]:
            queue_name = queue["queueName"]
            queue_nodelabel = queue.get("defaultNodeLabelExpression", "")
            if queue_nodelabel == "<DEFAULT_PARTITION>":
                queue_nodelabel = ""

            queue_capacity = queue
            for label_capacity in queue["capacities"]["queueCapacitiesByPartition"]:
                if label_capacity["partitionName"] == queue_nodelabel:
                    queue_capacity =label_capacity
                    break

            queue_resource_used = queue["resourcesUsed"]
            for label_used in queue["resources"]["resourceUsagesByPartition"]:
                if label_used["partitionName"] == queue_nodelabel:
                    queue_resource_used = label_used["used"]
                    break

            cap = queue_capacity["absoluteCapacity"] / 100.0
            partition_resource = labeled_resource[queue_nodelabel]

            cpu_cap.add_metric([queue_name], partition_resource.cpu * cap)
            mem_cap.add_metric([queue_name], partition_resource.mem * cap)
            gpu_cap.add_metric([queue_name], partition_resource.gpu * cap)

            cpu_avail.add_metric([queue_name], partition_resource.cpu * cap - queue_resource_used["vCores"])
            mem_avail.add_metric([queue_name], partition_resource.mem * cap - queue_resource_used["memory"] * 1024 * 1024)
            gpu_avail.add_metric([queue_name], partition_resource.gpu * cap - queue_resource_used["GPUs"])

            running_jobs.add_metric([queue_name], queue["numActiveApplications"])
            pending_jobs.add_metric([queue_name], queue["numPendingApplications"])
            running_containers.add_metric([queue_name], queue["numContainers"])
            pending_containers.add_metric([queue_name], queue["pendingContainers"])

        return [cpu_cap, cpu_avail,
                mem_cap, mem_avail,
                gpu_cap, gpu_avail,
                running_jobs, pending_jobs,
                running_containers, pending_containers]

class HealthResource(Resource):
    def render_GET(self, request):
        request.setHeader("Content-Type", "text/html; charset=utf-8")
        return "<html>Ok</html>".encode("utf-8")

def register_stack_trace_dump():
    faulthandler.register(signal.SIGTRAP, all_threads=True, chain=False)

 # https://github.com/prometheus/client_python/issues/322#issuecomment-428189291
def burninate_gc_collector():
    for callback in gc.callbacks[:]:
        if callback.__qualname__.startswith("GCCollector."):
            gc.callbacks.remove(callback)

    for name, collector in list(REGISTRY._names_to_collectors.items()):
        if name.startswith("python_gc_"):
            try:
                REGISTRY.unregister(collector)
            except KeyError:  # probably gone already
                pass

def main(args):
    register_stack_trace_dump()
    burninate_gc_collector()

    REGISTRY.register(YarnCollector(args.yarn_url))

    root = Resource()
    root.putChild(b"metrics", MetricsResource())
    root.putChild(b"healthz", HealthResource())

    factory = Site(root)
    reactor.listenTCP(int(args.port), factory)
    reactor.run()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("yarn_url", help="Yarn rest api address, eg: http://127.0.0.1:8088")
    parser.add_argument("--cluster-name", "-n", help="Yarn cluster name",
                        default="cluster_0")
    parser.add_argument("--port", "-p", help="Exporter listen port",default="9459")

    args = parser.parse_args()

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
                sys.stderr.write("unknown logging level " + level + \
                        ", default to INFO\n")
                result = logging.INFO

        return result

    logging.basicConfig(format="%(asctime)s - %(levelname)s - %(threadName)s - %(filename)s:%(lineno)s - %(message)s",
            level=get_logging_level())

    main(args)
