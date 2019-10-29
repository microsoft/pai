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

import os
import sys
import unittest
import yaml
import json
import logging
import logging.config
import collections

import prometheus_client

sys.path.append(os.path.abspath("../src/"))

import watchdog

log = logging.getLogger(__name__)

class TestJobExporter(unittest.TestCase):
    """
    Test job_exporter.py
    """
    def setUp(self):
        try:
            os.chdir(os.path.abspath("test"))
        except:
            pass

        configuration_path = "logging.yaml"

        if os.path.exists(configuration_path):
            with open(configuration_path, 'rt') as f:
                logging_configuration = yaml.safe_load(f.read())
            logging.config.dictConfig(logging_configuration)
            logging.getLogger()

    def tearDown(self):
        try:
            os.chdir(os.path.abspath(".."))
        except:
            pass

    def get_data_test_input(self, path):
        with open(path) as f:
            return f.read()

    def test_parse_pods_status(self):
        obj = json.loads(self.get_data_test_input("data/pods_list.json"))

        pod_gauge = watchdog.gen_pai_pod_gauge()
        container_gauge = watchdog.gen_pai_container_gauge()
        job_pod_gauge = watchdog.gen_pai_job_pod_gauge()
        pod_info = collections.defaultdict(lambda : [])

        watchdog.process_pods_status(obj, pod_gauge, container_gauge, job_pod_gauge, pod_info)

        self.assertTrue(len(pod_gauge.samples) > 0)
        self.assertEqual('10.151.40.4', pod_gauge.samples[0].labels['host_ip'])
        self.assertEqual('running', pod_gauge.samples[0].labels['phase'])
        self.assertEqual('true', pod_gauge.samples[0].labels['pod_scheduled'])
        self.assertEqual('true', pod_gauge.samples[0].labels['initialized'])

        self.assertTrue(len(container_gauge.samples) > 0)
        self.assertEqual('10.151.40.4', container_gauge.samples[0].labels['host_ip'])
        self.assertEqual('running', container_gauge.samples[0].labels['state'])
        self.assertEqual('default', container_gauge.samples[0].labels['namespace'])
        self.assertEqual('nvidia-drivers', container_gauge.samples[0].labels['name'])

        self.assertTrue(len(job_pod_gauge.samples) > 0)
        self.assertEqual('10.1.3.29', job_pod_gauge.samples[0].labels['host_ip'])
        self.assertEqual('pending', job_pod_gauge.samples[0].labels['phase'])
        self.assertEqual('true', job_pod_gauge.samples[0].labels['pod_bound'])
        self.assertEqual('true', job_pod_gauge.samples[0].labels['initialized'])

    def test_process_nodes_status(self):
        obj = json.loads(self.get_data_test_input("data/nodes_list.json"))

        gauges = watchdog.process_nodes_status(obj, {})

        self.assertTrue(len(gauges) == 4)

        for gauge in gauges:
            self.assertTrue(len(gauge.samples) > 0)

    def test_process_pods_with_no_condition(self):
        obj = json.loads(self.get_data_test_input("data/no_condtion_pod.json"))

        pod_gauge = watchdog.gen_pai_pod_gauge()
        container_gauge = watchdog.gen_pai_container_gauge()
        job_pod_gauge = watchdog.gen_pai_job_pod_gauge()
        pod_info = collections.defaultdict(lambda : [])

        watchdog.process_pods_status(obj, pod_gauge, container_gauge, job_pod_gauge, pod_info)

        self.assertTrue(len(pod_gauge.samples) > 0)
        self.assertEqual(0, len(container_gauge.samples))

    def test_process_pod_with_no_host_ip(self):
        obj = json.loads(self.get_data_test_input("data/no_condtion_pod.json"))

        class CustomCollector(object):
            def collect(self):
                pod_gauge = watchdog.gen_pai_pod_gauge()
                container_gauge = watchdog.gen_pai_container_gauge()
                job_pod_gauge = watchdog.gen_pai_job_pod_gauge()
                pod_info = collections.defaultdict(lambda : [])

                watchdog.process_pods_status(obj,
                        pod_gauge, container_gauge, job_pod_gauge, pod_info)

                yield pod_gauge
                yield container_gauge

        registry = CustomCollector()

        # expect no exception
        prometheus_client.write_to_textfile("/tmp/test_watchdog.prom", registry)

    def test_process_dlws_nodes_status(self):
        obj = json.loads(self.get_data_test_input("data/dlws_nodes_list.json"))

        pod_info = collections.defaultdict(lambda : [])
        pod_info["192.168.255.1"].append(watchdog.PodInfo("job1", 2))
        gauges = watchdog.process_nodes_status(obj, pod_info)

        self.assertTrue(len(gauges) == 4)

        self.assertEqual("k8s_node_gpu_available", gauges[1].name)
        self.assertEqual(1, len(gauges[1].samples))
        self.assertEqual(2, gauges[1].samples[0].value)
        self.assertEqual("k8s_node_gpu_total", gauges[2].name)
        self.assertEqual(1, len(gauges[2].samples))
        self.assertEqual(4, gauges[2].samples[0].value)
        self.assertEqual("k8s_node_gpu_reserved", gauges[3].name)
        self.assertEqual(1, len(gauges[3].samples))
        self.assertEqual(0, gauges[3].samples[0].value)

        for gauge in gauges:
            self.assertTrue(len(gauge.samples) > 0)

        for gauge in gauges[1:]:
            self.assertEqual("192.168.255.1", gauge.samples[0].labels["host_ip"])

    def test_process_dlws_nodes_status_with_unscheduable(self):
        obj = json.loads(self.get_data_test_input("data/dlws_nodes_list_with_unschedulable.json"))

        pod_info = collections.defaultdict(lambda : [])
        pod_info["192.168.255.1"].append(watchdog.PodInfo("job1", 2))
        gauges = watchdog.process_nodes_status(obj, pod_info)

        self.assertTrue(len(gauges) == 4)

        self.assertEqual("pai_node_count", gauges[0].name)
        self.assertEqual(1, len(gauges[0].samples))
        self.assertEqual("true", gauges[0].samples[0].labels["unschedulable"])
        self.assertEqual("k8s_node_gpu_available", gauges[1].name)
        self.assertEqual(1, len(gauges[1].samples))
        self.assertEqual(0, gauges[1].samples[0].value)
        self.assertEqual("k8s_node_gpu_total", gauges[2].name)
        self.assertEqual(1, len(gauges[2].samples))
        self.assertEqual(4, gauges[2].samples[0].value)
        self.assertEqual("k8s_node_gpu_reserved", gauges[3].name)
        self.assertEqual(1, len(gauges[3].samples))
        self.assertEqual(2, gauges[3].samples[0].value)

        for gauge in gauges:
            self.assertTrue(len(gauge.samples) > 0)

        for gauge in gauges[1:]:
            self.assertEqual("192.168.255.1", gauge.samples[0].labels["host_ip"])

if __name__ == '__main__':
    unittest.main()
