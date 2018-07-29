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
import unittest
import yaml
import logging
import logging.config
from exporter import gpu_exporter
from exporter.utils import Metric

class TestGPUExporter(unittest.TestCase):
    """
    Test gpu_exporter.py
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

    def test_parse_smi_xml_result(self):
        sample_path = "data/nvidia_smi_sample.xml"
        file = open(sample_path, "r")
        nvidia_smi_result = file.read()
        nvidia_smi_parse_result = gpu_exporter.parse_smi_xml_result(nvidia_smi_result)
        target_smi_info = {'1': {'gpuUtil': u'98', 'gpuMemUtil': u'97'},
                '0': {'gpuUtil': u'100', 'gpuMemUtil': u'99'}}
        self.assertEqual(target_smi_info, nvidia_smi_parse_result)

    def test_convert_gpu_info_to_metrics(self):
        info = {'1': {'gpuUtil': u'98', 'gpuMemUtil': u'97'},
                '0': {'gpuUtil': u'100', 'gpuMemUtil': u'99'}}
        metrics = gpu_exporter.convert_gpu_info_to_metrics(info)
        self.assertEqual(5, len(metrics))

        self.assertIn(Metric("nvidiasmi_attached_gpus", {}, 2), metrics)
        self.assertIn(Metric("nvidiasmi_utilization_gpu", {"minor_number": "0"}, "100"),
                metrics)
        self.assertIn(Metric("nvidiasmi_utilization_memory", {"minor_number": "0"}, "99"),
                metrics)
        self.assertIn(Metric("nvidiasmi_utilization_gpu", {"minor_number": "1"}, "98"),
                metrics)
        self.assertIn(Metric("nvidiasmi_utilization_memory", {"minor_number": "1"}, "97"),
                metrics)

    def test_exporter_will_not_report_unsupported_gpu(self):
        sample_path = "data/nvidia_smi_outdated_gpu.xml"
        file = open(sample_path, "r")
        nvidia_smi_result = file.read()
        nvidia_smi_parse_result = gpu_exporter.parse_smi_xml_result(nvidia_smi_result)
        self.assertEqual({}, nvidia_smi_parse_result)


if __name__ == '__main__':
    unittest.main()
