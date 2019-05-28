# -*- coding: utf-8 -*-
from __future__ import absolute_import

from mock import patch
import unittest
import requests_mock
from collections import namedtuple
import json
import sys
from StringIO import StringIO

import node_maintain



class NodeMaintainTestCase(unittest.TestCase):
    ArgsMock = namedtuple("ArgsMock", ["resource_manager_ip", "vc_name", "nodes"])

    @classmethod
    def setUpClass(cls):
        with open("capacity_scheduler_case1.json") as f:
            cls.capacity_scheduler_response = f.read()
        with open("node_label_case1.html") as f:
            cls.node_label_response = f.read()
        with open("cluster_nodes_case1.json") as f:
            cls.cluster_nodes_response = f.read()

    def setUp(self):
        pass

    @requests_mock.Mocker()
    def test_get_dedicate_vc(self, requests_get_mock):
        args = self.ArgsMock(resource_manager_ip="127.0.0.1", vc_name=None, nodes=None)

        requests_get_mock.get("http://127.0.0.1:8088/ws/v1/cluster/scheduler", text=self.capacity_scheduler_response)
        requests_get_mock.get("http://127.0.0.1:8088/cluster/nodelabels", text=self.node_label_response)
        requests_get_mock.get("http://127.0.0.1:8088/ws/v1/cluster/nodes", text=self.cluster_nodes_response)

        with patch('sys.stdout', new=StringIO()) as stdout_mock:
            node_maintain.get_dedicate_vc(args)
            output = stdout_mock.getvalue().strip()

        output_lines = set([line.strip() for line in output.split("\n")])
        self.assertSetEqual(
            {u'test_vc:', u'Nodes:', u'Nodes: 10.151.40.132', u'Resource: <CPUs:0, Memory:0MB, GPUs:0>', u'label_ex:',
             u'Resource: <CPUs:24, Memory:208896MB, GPUs:4>'}, output_lines)

    @patch.object(node_maintain.YarnOperator, "execute")
    @requests_mock.Mocker()
    def test_add_dedicate_vc(self, requests_get_mock, execute_mock):
        args = self.ArgsMock(resource_manager_ip="127.0.0.1", vc_name="test_vc", nodes={"10.151.40.132"})

        execute_mock.return_value = None
        requests_get_mock.get("http://127.0.0.1:8088/cluster/nodelabels", text=self.node_label_response)
        requests_get_mock.get("http://127.0.0.1:8088/ws/v1/cluster/scheduler", text=self.capacity_scheduler_response)
        requests_get_mock.get("http://127.0.0.1:8088/ws/v1/cluster/nodes", text=self.cluster_nodes_response)
        requests_get_mock.get("http://127.0.0.1:8088/ws/v1/cluster/scheduler", text=self.capacity_scheduler_response)

        node_maintain.add_dedicate_vc(args)

        # execute_mock.assert_called_with('yarn --config ./.hadoop rmadmin -addToClusterNodeLabels \"10.151.40.133\"')


if __name__ == "__main__":
    assert not hasattr(sys.stdout, "getvalue")
    unittest.main(module=__name__, buffer=True, exit=False)
