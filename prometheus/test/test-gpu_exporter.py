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

import sys
import os
import unittest
import sys
sys.path.append("..")
from exporter.gpu_exporter import parse_smi_xml_result

class TestGPUExporter(unittest.TestCase):
    """
    Test docker_inspect.py
    """
    def setUp(self):
        try:
            os.chdir(os.path.abspath("test"))
        except:
            pass

    def tearDown(self):
        try:
            os.chdir(os.path.abspath(".."))
        except:
            pass

    def test_parse_smi_xml_result(self):
        sample_path = "data/nvidia_smi_sample.xml"
        file = open(sample_path, "r") 
        nvidiaSmiResult = file.read()
        outputDir = "data"
        nvidiaSmiParseResult = parse_smi_xml_result(nvidiaSmiResult, outputDir)
        targetSmiInfo = {'1': {'gpuUtil': u'100', 'gpuMemUtil': u'100'}, '0': {'gpuUtil': u'100', 'gpuMemUtil': u'100'}, '3': {'gpuUtil': u'100', 'gpuMemUtil': u'100'}, '2': {'gpuUtil': u'100', 'gpuMemUtil': u'100'}, '5': {'gpuUtil': u'100', 'gpuMemUtil': u'100'}, '4': {'gpuUtil': u'100', 'gpuMemUtil': u'100'}}
        self.assertEqual(targetSmiInfo, nvidiaSmiParseResult)
        pass

if __name__ == '__main__':
    unittest.main()