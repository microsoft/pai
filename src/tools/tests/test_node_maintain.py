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

from __future__ import absolute_import,print_function

from mock import patch, call
import unittest
import requests_mock
from collections import namedtuple
import json
import sys
from StringIO import StringIO
import xmltodict
import os

from node_maintain import add_dedicate_vc, get_dedicate_vc, remove_dedicate_vc


class NodeMaintainTestCase(unittest.TestCase):
    ArgsMock = namedtuple("ArgsMock", ["resource_manager_ip", "vc_name", "nodes", "restserver_ip"])

    @classmethod
    def setUpClass(cls):
        with open("capacity_scheduler_case1.json") as f:
            cls.capacity_scheduler_response = f.read()
        with open("cluster_nodes_case1.json") as f:
            cls.cluster_nodes_response = f.read()

    def setUp(self):
        if not os.path.exists(".restserver"):
            os.mkdir(".restserver")
        with open(".restserver/user_info", "w") as f:
            json.dump({"username": "test", "password": "test"}, f)

    @requests_mock.Mocker()
    def test_get_dedicate_vc(self, requests_get_mock):
        args = self.ArgsMock(resource_manager_ip="127.0.0.1", vc_name=None, nodes=None)

        requests_get_mock.get("http://127.0.0.1:8088/ws/v1/cluster/scheduler", text=self.capacity_scheduler_response)
        requests_get_mock.get("http://127.0.0.1:8088/ws/v1/cluster/nodes", text=self.cluster_nodes_response)

        with patch("sys.stdout", new=StringIO()) as stdout_mock:
            get_dedicate_vc(args)
            output = stdout_mock.getvalue().strip()

        output_lines = set([line.strip() for line in output.split("\n")])
        self.assertSetEqual(
            {u"test_vc:", u"Nodes:", u"Nodes: 10.151.40.132", u"Resource: <CPUs:0.0, Memory:0.0MB, GPUs:0.0>", u"label_ex:",
             u"Resource: <CPUs:24.0, Memory:208896.0MB, GPUs:4.0>"}, output_lines)

    @patch("node_maintain.YarnOperator.execute")
    def test_add_dedicate_vc(self, execute_mock):
        args = self.ArgsMock(resource_manager_ip="127.0.0.1", restserver_ip="127.0.0.1", vc_name="test_vc_2", nodes={"10.151.40.132"})

        execute_mock.side_effect = [
            "Node Labels: <label_ex:exclusivity=true>,<label_non:exclusivity=false>,<test_vc:exclusivity=true",
            None,
            None,
        ]
        with requests_mock.mock() as requests_get_mock:
            requests_get_mock.post("http://127.0.0.1:9186/api/v1/token", text=json.dumps({"token": "test"}))
            requests_get_mock.get("http://127.0.0.1:8088/ws/v1/cluster/scheduler", text=self.capacity_scheduler_response)
            nodes_info = json.loads(self.cluster_nodes_response)
            nodes_info["nodes"]["node"][0].pop("nodeLabels")
            requests_get_mock.get("http://127.0.0.1:8088/ws/v1/cluster/nodes", text=json.dumps(nodes_info))
            requests_get_mock.put("http://127.0.0.1:9186/api/v1/virtual-clusters/test_vc_2", text="{}")
            requests_get_mock.put("http://127.0.0.1:8088/ws/v1/cluster/scheduler-conf")

            add_dedicate_vc(args)

            yarn_command_call = [
                call("yarn --config ./.hadoop cluster --list-node-labels"),
                call("yarn --config ./.hadoop rmadmin -addToClusterNodeLabels \"test_vc_2(exclusive=true)\""),
                call("yarn --config ./.hadoop rmadmin -replaceLabelsOnNode \"10.151.40.132=test_vc_2\" -failOnUnknownNodes")
            ]
            execute_mock.assert_has_calls(yarn_command_call, any_order=False)

            scheduler_conf_call = [request_object for request_object in requests_get_mock.request_history if
                                   request_object.path == "/ws/v1/cluster/scheduler-conf"]
            self.assertEqual(len(scheduler_conf_call), 2)
            add_queue, update_capacity = [xmltodict.parse(request_object.text) for request_object in
                                                         scheduler_conf_call]
            global_update = {or_dict["key"]: or_dict["value"] for or_dict in add_queue["sched-conf"]["global-updates"]["entry"]}
            global_update_expect = {
                u"yarn.scheduler.capacity.root.test_vc_2.accessible-node-labels.test_vc_2.capacity": u"100",
                u"yarn.scheduler.capacity.root.accessible-node-labels.test_vc_2.capacity": u"100"
            }
            self.assertDictEqual(global_update, global_update_expect)
            queue_name = add_queue["sched-conf"]["update-queue"]["queue-name"]
            queue_name_expect = u"root.test_vc_2"
            self.assertEqual(queue_name, queue_name_expect)
            queue_update = {or_dict["key"]: or_dict["value"] for or_dict in add_queue["sched-conf"]["update-queue"]["params"]["entry"]}
            queue_update_expect = {
                u"capacity": u"0",
                u"accessible-node-labels": u"test_vc_2",
                u"user-limit-factor": u"100",
                u"default-node-label-expression": u"test_vc_2",
                u"maximum-applications": u"10000",
                u"maximum-capacity": u"0",
                u"disable_preemption": u"True"
            }
            self.assertDictEqual(queue_update, queue_update_expect)

            update_capacity = {or_dict["key"]: or_dict["value"] for or_dict in
                               update_capacity["sched-conf"]["global-updates"]["entry"]}
            update_capacity_expect = {
                u"yarn.scheduler.capacity.root.default.maximum-capacity": u"100.0",
                u"yarn.scheduler.capacity.root.label_ex.disable_preemption": u"True",
                u"yarn.scheduler.capacity.root.test_vc.capacity": u"0.0",
                u"yarn.scheduler.capacity.root.label_ex.maximum-capacity": u"0.0",
                u"yarn.scheduler.capacity.root.vc_a.disable_preemption": u"True",
                u"yarn.scheduler.capacity.root.vc_a.capacity": u"20.0",
                u"yarn.scheduler.capacity.root.vc_a.maximum-capacity": u"20.0",
                u"yarn.scheduler.capacity.root.default.capacity": u"80.0",
                u"yarn.scheduler.capacity.root.test_vc.disable_preemption": u"True",
                u"yarn.scheduler.capacity.root.test_vc.maximum-capacity": u"0.0",
                u"yarn.scheduler.capacity.root.label_ex.capacity": u"0.0"
            }
            self.assertDictEqual(update_capacity, update_capacity_expect)


    @patch("node_maintain.YarnOperator.execute")
    def test_remove_dedicate_vc(self, execute_mock):
        args = self.ArgsMock(resource_manager_ip="127.0.0.1", restserver_ip="127.0.0.1", vc_name="test_vc", nodes=None)

        execute_mock.side_effect = [
            None,
            "Node Labels: <label_ex:exclusivity=true>,<label_non:exclusivity=false>,<test_vc:exclusivity=true>",
            None
        ]
        with requests_mock.mock() as requests_get_mock:
            requests_get_mock.post("http://127.0.0.1:9186/api/v1/token", text=json.dumps({"token": "test"}))
            requests_get_mock.get("http://127.0.0.1:8088/ws/v1/cluster/scheduler",
                                  text=self.capacity_scheduler_response)
            requests_get_mock.get("http://127.0.0.1:8088/ws/v1/cluster/nodes", text=self.cluster_nodes_response)
            requests_get_mock.put("http://127.0.0.1:8088/ws/v1/cluster/scheduler-conf")
            requests_get_mock.delete("http://127.0.0.1:9186/api/v1/virtual-clusters/test_vc", text="{}")

            remove_dedicate_vc(args)

            yarn_command_call = [
                call("yarn --config ./.hadoop rmadmin -replaceLabelsOnNode \"10.151.40.132=\" -failOnUnknownNodes"),
                call("yarn --config ./.hadoop cluster --list-node-labels"),
                call("yarn --config ./.hadoop rmadmin -removeFromClusterNodeLabels test_vc")
            ]
            execute_mock.assert_has_calls(yarn_command_call, any_order=False)

            scheduler_conf_call = [request_object for request_object in requests_get_mock.request_history if request_object.path == "/ws/v1/cluster/scheduler-conf"]
            self.assertEqual(len(scheduler_conf_call), 3)
            update_capacity, stop_queue, remove_queue = [xmltodict.parse(request_object.text) for request_object in scheduler_conf_call]
            update_capacity = {or_dict["key"]: or_dict["value"] for or_dict in update_capacity["sched-conf"]["global-updates"]["entry"]}
            update_capacity_expect = {
                u"yarn.scheduler.capacity.root.default.maximum-capacity": u"100.0",
                u"yarn.scheduler.capacity.root.test_vc.capacity": u"0.0",
                u"yarn.scheduler.capacity.root.label_ex.maximum-capacity": u"0.0",
                u"yarn.scheduler.capacity.root.vc_a.maximum-capacity": u"5.0",
                u"yarn.scheduler.capacity.root.vc_a.capacity": u"5.0",
                u"yarn.scheduler.capacity.root.default.capacity": u"95.0",
                u"yarn.scheduler.capacity.root.test_vc.maximum-capacity": u"0.0",
                u"yarn.scheduler.capacity.root.label_ex.capacity": u"0.0"
            }
            self.assertDictEqual(update_capacity, update_capacity_expect)

            remove_queue = {or_dict["key"]: or_dict["value"] for or_dict in
                            remove_queue["sched-conf"]["global-updates"]["entry"]}
            remove_queue_expect = {
                u"yarn.scheduler.capacity.root.accessible-node-labels.test_vc.capacity": u"0",
                u"yarn.scheduler.capacity.root.test_vc.accessible-node-labels.test_vc.capacity": u"0",
                u"yarn.scheduler.capacity.root.test_vc.default-node-label-expression": None,
            }
            self.assertDictEqual(remove_queue, remove_queue_expect)


if __name__ == "__main__":
    assert not hasattr(sys.stdout, "getvalue")
    unittest.main(module=__name__, buffer=True, exit=False)
