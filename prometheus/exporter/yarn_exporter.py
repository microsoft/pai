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

from datetime import datetime, time, timedelta
from wsgiref.simple_server import make_server
from collections import defaultdict
import urllib.parse
import argparse

from prometheus_client.core import GaugeMetricFamily, CounterMetricFamily, REGISTRY
from prometheus_client import make_wsgi_app
import attr
import requests

class YarnCollector(object):
    api_path = '/'

    def __init__(self, endpoint, cluster_name='yarn'):
        self.endpoint = endpoint
        self.cluster_name = cluster_name

    @property
    def metric_url(self):
        return urllib.parse.urljoin(self.endpoint, self.api_path)

    def collect(self):
        raise NotImplemented

@attr.s
class YarnMetric(object):
    GAUGE = 'gauge'
    COUNTER = 'counter'
    supported_type = [GAUGE, COUNTER]

    namespace = "yarn"

    name = attr.ib()
    metric_type = attr.ib()

    @metric_type.validator
    def check(self, _, value):
        if value not in self.supported_type:
            raise ValueError('Parameter metric_type value must in {0}, can not be {1}'.format(self.supported_type, value))

    description = attr.ib()
    labels = attr.ib(default=attr.Factory(list))

    @property
    def metric_name(self):
        return '{0}_{1}'.format(self.namespace, self.name)

    def create_metric(self):
        if self.metric_type == self.GAUGE:
            return GaugeMetricFamily(self.metric_name, self.description, labels=self.labels)
        elif self.metric_type == self.COUNTER:
            return CounterMetricFamily(self.metric_name, self.description, labels=self.labels)
        else:
            raise ValueError('property metric_type value must in {0}, can not be {1}'.format(self.supported_type, self.metric_type))

class YarnMetricCollector(YarnCollector):
    api_path = '/ws/v1/cluster/metrics'

    def collect(self):
        response = requests.get(self.metric_url, allow_redirects=True)
        response.raise_for_status()
        metric = response.json()['clusterMetrics']


        total_gpu_num = YarnMetric('total_gpu_num', YarnMetric.COUNTER, 
                                    'The total number of GPUs of cluster',['cluster']).create_metric()
        total_gpu_num.add_metric([self.cluster_name], metric['totalGPUs'])
        yield total_gpu_num

        gpus_used = YarnMetric('gpus_used', YarnMetric.COUNTER, 
                                    'The number of allocated GPUs',['cluster']).create_metric()
        gpus_used.add_metric([self.cluster_name], metric['allocatedGPUs'])
        yield gpus_used
        
        nodes_all = YarnMetric('nodes_all', YarnMetric.GAUGE,
                               'The total number of nodes', ['cluster']).create_metric()
        nodes_all.add_metric([self.cluster_name], metric['totalNodes'])
        yield nodes_all

        nodes_active = YarnMetric('nodes_active', YarnMetric.GAUGE,
                                  'The number of active nodes', ['cluster']).create_metric()
        nodes_active.add_metric([self.cluster_name], metric['activeNodes'])
        yield nodes_active

        # nodes_lost = YarnMetric('nodes_lost', YarnMetric.GAUGE,
        #                         'The number of lost nodes', ['cluster']).create_metric()
        # nodes_lost.add_metric([self.cluster_name], metric['lostNodes'])
        # yield nodes_lost

        # nodes_unhealthy = YarnMetric('nodes_unhealthy', YarnMetric.GAUGE,
        #                              'The number of unhealthy nodes', ['cluster']).create_metric()
        # nodes_unhealthy.add_metric([self.cluster_name], metric['unhealthyNodes'])
        # yield nodes_unhealthy

        # nodes_decommissioned = YarnMetric('nodes_decommissioned', YarnMetric.COUNTER,
        #                                   'The number of nodes decommissioned', ['cluster']).create_metric()
        # nodes_decommissioned.add_metric([self.cluster_name], metric['decommissionedNodes'])
        # yield nodes_decommissioned

        # nodes_rebooted = YarnMetric('nodes_rebooted', YarnMetric.COUNTER,
        #                             'The number of nodes rebooted', ['cluster']).create_metric()
        # nodes_rebooted.add_metric([self.cluster_name], metric['rebootedNodes'])
        # yield nodes_rebooted

def get_parser():
    parser = argparse.ArgumentParser()
    parser.add_argument("yarn_url", help="Yarn rest api address, eg: http://127.0.0.1:8088")
    parser.add_argument("--cluster-name", "-n", help="Yarn cluster name",
                        default="cluster_0")
    parser.add_argument("--port", "-p", help="Exporter listen port",default="9459")
    parser.add_argument("--host", "-H", help="Exporter host address", default="0.0.0.0")
    parser.add_argument("--collected-apps", "-c", nargs="*",
                        help="Name of applications need to collect running status")
    
    return parser

if __name__ == "__main__":
    args = get_parser().parse_args()


    REGISTRY.register(YarnMetricCollector(args.yarn_url, args.cluster_name))
    app = make_wsgi_app(REGISTRY)
    httpd = make_server(args.host, int(args.port), app)
    httpd.serve_forever()