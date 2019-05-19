# -*- coding: utf-8 -*-
from __future__ import absolute_import

from mock import patch
import unittest
import requests
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
        self.assertEqual(op.alert_manager_url, "http://127.0.0.1:5000/prometheus/api/v1/query?query=ALERTS")

    def test_get_gpu_alert_nodes_success(self):
        with requests_mock.mock() as requests_get_mock:
            requests_get_mock.get(self.alertOperator.alert_manager_url, text=json.dumps(self.success_response()))

            alerts = self.alertOperator.get_gpu_alert_nodes()

            self.assertTrue(requests_get_mock.called)
            self.assertDictEqual(alerts, {"10.0.0.3": "NvidiaZombieProcess"})

    def test_get_gpu_alert_nodes_bad_request(self):
        with requests_mock.mock() as requests_get_mock:
            requests_get_mock.get(self.alertOperator.alert_manager_url, status_code=404)

            with self.assertRaises(SystemExit) as cm:
                alerts = self.alertOperator.get_gpu_alert_nodes()

            self.assertTrue(requests_get_mock.called)
            self.assertEqual(cm.exception.code, 1)

    def test_get_gpu_alert_nodes_fail_request(self):
        with requests_mock.mock() as requests_get_mock:
            requests_get_mock.get(self.alertOperator.alert_manager_url, text=json.dumps(self.failure_response()))

            with self.assertRaises(SystemExit) as cm:
                alerts = self.alertOperator.get_gpu_alert_nodes()

            self.assertTrue(requests_get_mock.called)
            self.assertEqual(cm.exception.code, 1)


if __name__ == "__main__":
    unittest.main()
