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

import base

sys.path.append(os.path.abspath("../src/"))

import nvidia

class TestNvidia(base.TestBase):
    """
    Test nvidia.py
    """
    def test_parse_smi_xml_result(self):
        sample_path = "data/nvidia_smi_sample.xml"
        with open(sample_path, "r") as f:
            nvidia_smi_result = f.read()
        nvidia_smi_parse_result = nvidia.parse_smi_xml_result(nvidia_smi_result)
        target_smi_info = {'1': {'gpu_util': 98, 'gpu_mem_util': 50},
                '0': {'gpu_util': 100, 'gpu_mem_util': 25}}
        self.assertEqual(target_smi_info, nvidia_smi_parse_result)

    def test_exporter_will_not_report_unsupported_gpu(self):
        sample_path = "data/nvidia_smi_outdated_gpu.xml"
        with open(sample_path, "r") as f:
            nvidia_smi_result = f.read()
        nvidia_smi_parse_result = nvidia.parse_smi_xml_result(nvidia_smi_result)
        self.assertEqual({}, nvidia_smi_parse_result)


if __name__ == '__main__':
    unittest.main()
