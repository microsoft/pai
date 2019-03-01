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

from prometheus_client.core import GaugeMetricFamily, REGISTRY
from prometheus_client import Histogram
from prometheus_client.twisted import MetricsResource

import requests

from twisted.web.server import Site
from twisted.web.resource import Resource
from twisted.internet import reactor

##### yarn-exporter will generate following metrics

cluster_metrics_histogram = Histogram("yarn_api_cluster_metrics_latency_seconds",
        "Resource latency for requesting yarn api /ws/v1/cluster/metrics")

def gen_total_gpu_count():
    return GaugeMetricFamily("yarn_total_gpu_num", "count of total gpu number")

def gen_used_gpu_count():
    return GaugeMetricFamily("yarn_gpus_used", "count of allocated gpu by yarn")

def gen_total_node_count():
    return GaugeMetricFamily("yarn_nodes_all", "total node count in yarn")

def gen_active_node_count():
    return GaugeMetricFamily("yarn_nodes_active", "active node count in yarn")

##### yarn-exporter will generate above metrics

def request_with_histogram(url, histogram, *args, **kwargs):
    with histogram.time():
        return requests.get(url, *args, **kwargs)


class YarnCollector(object):
    def __init__(self, yarn_url):
        self.metric_url = urllib.parse.urljoin(yarn_url, "/ws/v1/cluster/metrics")

    def collect(self):
        response = request_with_histogram(self.metric_url, cluster_metrics_histogram,
                allow_redirects=True)
        response.raise_for_status()
        metric = response.json()["clusterMetrics"]

        total_gpu_num = gen_total_gpu_count()
        total_gpu_num.add_metric([], metric["totalGPUs"])
        yield total_gpu_num

        gpus_used = gen_used_gpu_count()
        gpus_used.add_metric([], metric["allocatedGPUs"])
        yield gpus_used

        nodes_all = gen_total_gpu_count()
        nodes_all.add_metric([], metric["totalNodes"])
        yield nodes_all

        nodes_active = gen_active_node_count()
        nodes_active.add_metric([], metric["activeNodes"])
        yield nodes_active


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

    main(args)
