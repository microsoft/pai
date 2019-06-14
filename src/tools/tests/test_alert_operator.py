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

from __future__ import absolute_import

from mock import patch
import unittest
from requests.exceptions import HTTPError
import json
import requests_mock

from operator_wrapper.alert_operator import AlertOperator


class AlertOperatorTestCase(unittest.TestCase):
    @staticmethod
    def success_response():
        response = {
            "status": "success",
            "data": {
                "resultType": "vector",
                "result": [
                    {
                        "metric": {
                            "__name__": "ALERTS",
                            "alertname": "JobExporterHangs",
                            "alertstate": "pending",
                            "instance": "10.0.0.1:9102",
                            "job": "pai_serivce_exporter",
                            "name": "docker_daemon_collector",
                            "pai_service_name": "job-exporter",
                            "scraped_from": "job-exporter-p4skn",
                            "type": "pai_service"
                        },
                        "value": [
                            1558204199.489,
                            "1"
                        ]
                    },
                    {
                        "metric": {
                            "__name__": "ALERTS",
                            "alertname": "NodeMemoryUsage",
                            "alertstate": "firing",
                            "instance": "10.0.0.2:9100",
                            "job": "pai_serivce_exporter",
                            "pai_service_name": "node-exporter",
                            "scraped_from": "node-exporter-blkpp"
                        },
                        "value": [
                            1558204199.489,
                            "1"
                        ]
                    },
                    {
                        "metric": {
                            "__name__": "ALERTS",
                            "alertname": "NvidiaZombieProcess",
                            "alertstate": "firing",
                            "command": "nvidia-smi",
                            "instance": "10.0.0.3:9102",
                            "job": "pai_serivce_exporter",
                            "pai_service_name": "job-exporter",
                            "scraped_from": "job-exporter-t4sv6"
                        },
                        "value": [
                            1558204199.489,
                            "1"
                        ]
                    }
                ]
            }
        }

        return response

    @staticmethod
    def failure_response():
        response = {
            "status": "failure",
            "data": {
            }
        }
        return response

    def setUp(self):
        self.alertOperator = AlertOperator("localhost")

    def test__init__(self):
        op = AlertOperator("127.0.0.1", "5000")
        self.assertEqual(op.master_ip, "127.0.0.1")
        self.assertEqual(op.port, "5000")

    def test_get_gpu_alert_nodes_success(self):
        with requests_mock.mock() as requests_get_mock:
            requests_get_mock.get("http://localhost:9091/prometheus/api/v1/query?query=ALERTS", text=json.dumps(self.success_response()))

            alerts = self.alertOperator.get_gpu_alert_nodes()

            self.assertTrue(requests_get_mock.called)
            self.assertDictEqual(alerts, {"10.0.0.3": "NvidiaZombieProcess"})

    def test_get_gpu_alert_nodes_bad_request(self):
        with requests_mock.mock() as requests_get_mock:
            requests_get_mock.get("http://localhost:9091/prometheus/api/v1/query?query=ALERTS", status_code=404)

            with self.assertRaises(HTTPError) as cm:
                alerts = self.alertOperator.get_gpu_alert_nodes()

            self.assertTrue(requests_get_mock.called)

    def test_get_gpu_alert_nodes_fail_request(self):
        with requests_mock.mock() as requests_get_mock:
            requests_get_mock.get("http://localhost:9091/prometheus/api/v1/query?query=ALERTS", text=json.dumps(self.failure_response()))

            with self.assertRaises(SystemExit) as cm:
                alerts = self.alertOperator.get_gpu_alert_nodes()

            self.assertTrue(requests_get_mock.called)
            self.assertEqual(cm.exception.code, 1)


if __name__ == "__main__":
    unittest.main()
