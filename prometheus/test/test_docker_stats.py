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
from exporter.docker_stats import parse_docker_stats
from exporter.docker_stats import convert_to_byte
from exporter.docker_stats import parse_usage_limit
from exporter.docker_stats import parse_io
from exporter.docker_stats import parse_percentile

class TestDockerStats(unittest.TestCase):
    """
    Test docker_stats.py
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

    def test_parse_docker_inspect(self):
        sample_path = "data/docker_stats_sample.txt"
        file = open(sample_path, "r")
        docker_stats = file.read()
        stats_info = parse_docker_stats(docker_stats)
        target_stats_info = {'722dac0a62cf0243e63a268b8ef995e8386c185c712f545c0c403b295a529636': {'BlockIO': {'out': 163577856.0, 'in': 29360128.0}, 'NetIO': {'out': 456340275200.0, 'in': 1099511627776.0}, 'CPUPerc': '0.00', 'MemPerc': '0.19', 'id': '722dac0a62cf0243e63a268b8ef995e8386c185c712f545c0c403b295a529636', 'MemUsage_Limit': {'usage': 111149056.0, 'limit': 59055800320.0}}, '33a22dcd4ba31ebc4a19fae865ee62285b6fae98a6ab72d2bc65e41cdc70e419': {'BlockIO': {'out': 0.0, 'in': 29360128.0}, 'NetIO': {'out': 0.0, 'in': 0.0}, 'CPUPerc': '0.00', 'MemPerc': '6.23', 'id': '33a22dcd4ba31ebc4a19fae865ee62285b6fae98a6ab72d2bc65e41cdc70e419', 'MemUsage_Limit': {'usage': 18874368.0, 'limit': 314572800.0}}}
        self.assertEqual(target_stats_info, stats_info)
        pass

    def test_convert_to_byte(self):
        data = "380.4MiB"
        result = convert_to_byte(data)
        self.assertEqual(398458880.0, result)
        pass

    def test_parse_usage_limit(self):
        data = "380.4MiB / 55.03GiB"
        result = parse_usage_limit(data)
        target = {'usage': 398458880.0, 'limit': 59055800320.0}
        self.assertEqual(target, result)
        pass

    def test_parse_io(self):
        data = "0B / 0B"
        result = parse_io(data)
        target = {'out': 0.0, 'in': 0.0}
        self.assertEqual(target, result)
        pass

    def test_parse_percentile(self):
        data = "24.45%"
        result = parse_percentile(data)
        target = "24.45"
        self.assertEqual(target, result)
        pass

if __name__ == '__main__':
    unittest.main()
