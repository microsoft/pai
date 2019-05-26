# -*- coding: utf-8 -*-
from __future__ import absolute_import

from mock import patch
import unittest
import requests_mock
from collections import namedtuple
import json
import sys
from StringIO import StringIO

from node_maintain import *



class NodeMaintainTestCase(unittest.TestCase):
    ArgsMock = namedtuple("ArgsMock", ["resource_manager_ip", "vc_name", "nodes"])

    def setUp(self):
        pass

    def test_get_dedicate_vc(self):

        with requests_mock.mock() as requests_get_mock:
            with open("capacity_scheduler_case1.json") as f:
                response = f.read()
            requests_get_mock.get("http://127.0.0.1:8088/ws/v1/cluster/scheduler", text=response)
            with open("node_label_case1.html") as f:
                response = f.read()
            requests_get_mock.get("http://127.0.0.1:8088/cluster/nodelabels", text=response)
            with open("cluster_nodes_case1.json") as f:
                response = f.read()
            requests_get_mock.get("http://127.0.0.1:8088/ws/v1/cluster/nodes", text=response)

            args = self.ArgsMock(resource_manager_ip="127.0.0.1", vc_name=None, nodes=None)

            with patch('sys.stdout', new=StringIO()) as stdout_mock:
                get_dedicate_vc(args)
                output = stdout_mock.getvalue().strip()

            output_lines = set([line.strip() for line in output.split("\n")])
            self.assertSetEqual(set([u'test_vc:', u'Nodes:', u'Nodes: 10.151.40.132', u'Resource: <CPUs:0, Memory:0MB, GPUs:0>', u'label_ex:', u'Resource: <CPUs:24, Memory:208896MB, GPUs:4>']), output_lines)




if __name__ == "__main__":
    assert not hasattr(sys.stdout, "getvalue")
    unittest.main(module=__name__, buffer=True, exit=False)
