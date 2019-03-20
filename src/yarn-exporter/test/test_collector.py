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
import logging
import json

import base

sys.path.append(os.path.abspath("../src/"))

import yarn_exporter
from yarn_exporter import YarnCollector

logger = logging.getLogger(__name__)

class TestYarnCollector(base.TestBase):
    """
    Test YarnCollector in yarn_exporter.py
    """

    def test_gen_nodes_metrics(self):
        with open("data/nodes") as f:
            obj = json.loads(f.read())

        total_resource = yarn_exporter.ResourceItem()
        node_count = yarn_exporter.NodeCount()
        metrics = YarnCollector.gen_nodes_metrics(obj, total_resource, node_count)

        self.assertEqual(1, node_count.total)
        self.assertEqual(1, node_count.active)

        self.assertEqual(24, total_resource.cpu)
        self.assertEqual(184320 * 1024 * 1024, total_resource.mem)
        self.assertEqual(4, total_resource.gpu)

        self.assertEqual(6, len(metrics))
        # total cpu
        self.assertEqual(1, len(metrics[0].samples))
        self.assertEqual(24, metrics[0].samples[0].value)

        # available cpu
        self.assertEqual(1, len(metrics[1].samples))
        self.assertEqual(15, metrics[1].samples[0].value)

        # total mem
        self.assertEqual(1, len(metrics[2].samples))
        self.assertEqual(184320 * 1024 * 1024, metrics[2].samples[0].value)

        # available mem
        self.assertEqual(1, len(metrics[3].samples))
        self.assertEqual(150528 * 1024 * 1024, metrics[3].samples[0].value)

        # total gpu
        self.assertEqual(1, len(metrics[4].samples))
        self.assertEqual(4, metrics[4].samples[0].value)

        # available gpu
        self.assertEqual(1, len(metrics[5].samples))
        self.assertEqual(3, metrics[5].samples[0].value)

    def test_gen_scheduler_metrics(self):
        with open("data/nodes") as f:
            obj = json.loads(f.read())

        total_resource = yarn_exporter.ResourceItem()
        node_count = yarn_exporter.NodeCount()
        YarnCollector.gen_nodes_metrics(obj, total_resource, node_count)

        with open("data/scheduler") as f:
            obj = json.loads(f.read())

        metrics = YarnCollector.gen_scheduler_metrics(obj, total_resource)

        self.assertEqual(10, len(metrics))

        self.assertEqual(1, len(metrics[0].samples))

        # queue cpu cap
        self.assertEqual(1, len(metrics[0].samples))
        self.assertEqual(24, metrics[0].samples[0].value)

        # queue cpu available
        self.assertEqual(1, len(metrics[1].samples))
        self.assertEqual(15, metrics[1].samples[0].value)

        # queue mem cap
        self.assertEqual(1, len(metrics[2].samples))
        self.assertEqual(184320 * 1024 * 1024, metrics[2].samples[0].value)

        # queue mem available
        self.assertEqual(1, len(metrics[3].samples))
        self.assertEqual(150528 * 1024 * 1024, metrics[3].samples[0].value)

        # queue gpu cap
        self.assertEqual(1, len(metrics[4].samples))
        self.assertEqual(4, metrics[4].samples[0].value)

        # queue gpu available
        self.assertEqual(1, len(metrics[5].samples))
        self.assertEqual(3, metrics[5].samples[0].value)

        # running jobs
        self.assertEqual(1, len(metrics[6].samples))
        self.assertEqual(1, metrics[6].samples[0].value)

        # pending jobs
        self.assertEqual(1, len(metrics[7].samples))
        self.assertEqual(0, metrics[7].samples[0].value)

        # running containers
        self.assertEqual(1, len(metrics[8].samples))
        self.assertEqual(2, metrics[8].samples[0].value)

        # pending containers
        self.assertEqual(1, len(metrics[9].samples))
        self.assertEqual(0, metrics[9].samples[0].value)

    def test_gen_nodes_metrics_using_empty_nodes(self):
        with open("data/empty_nodes") as f:
            obj = json.loads(f.read())

        total_resource = yarn_exporter.ResourceItem()
        node_count = yarn_exporter.NodeCount()
        metrics = YarnCollector.gen_nodes_metrics(obj, total_resource, node_count)

if __name__ == '__main__':
    unittest.main()
