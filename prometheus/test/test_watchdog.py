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

# dirty here, used to help watchdog find common.py
sys.path.append(os.path.abspath("../pai-management/k8sPaiLibrary/maintainlib/"))

from exporter import watchdog
from exporter.utils import Metric

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

        configuration_path = "test_logging.yaml"

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

        metrics = watchdog.parse_pods_status(obj)
        self.assertTrue(len(metrics) > 0)

    def test_parse_nodes_status(self):
        obj = json.loads(self.get_data_test_input("data/nodes_list.json"))

        metrics = watchdog.parse_nodes_status(obj)
        self.assertTrue(len(metrics) > 0)

    def test_parse_pods_with_no_condition(self):
        obj = json.loads(self.get_data_test_input("data/no_condtion_pod.json"))

        metrics = watchdog.parse_pods_status(obj)
        self.assertTrue(len(metrics) > 0)

if __name__ == '__main__':
    unittest.main()
