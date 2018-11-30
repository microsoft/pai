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

from docker_stats import parse_docker_stats
from docker_stats import convert_to_byte
from docker_stats import parse_usage_limit
from docker_stats import parse_io
from docker_stats import parse_percentile

class TestDockerStats(base.TestBase):
    """
    Test docker_stats.py
    """
    def test_parse_docker_inspect(self):
        sample_path = "data/docker_stats_sample.txt"
        with open(sample_path, "r") as f:
            docker_stats = f.read()

        stats_info = parse_docker_stats(docker_stats)
        target_stats_info = {'722dac0a62cf0243e63a268b8ef995e8386c185c712f545c0c403b295a529636': {'BlockIO': {'out': 156000000.0, 'in': 28600000.0}, 'NetIO': {'out': 425000000000.0, 'in': 1580000000000.0}, 'CPUPerc': 0.00, 'MemPerc': 0.19, 'id': '722dac0a62cf0243e63a268b8ef995e8386c185c712f545c0c403b295a529636', 'MemUsage_Limit': {'usage': 111149056.0, 'limit': 59088012574.72}, 'name': 'alert-manager'}, '33a22dcd4ba31ebc4a19fae865ee62285b6fae98a6ab72d2bc65e41cdc70e419': {'BlockIO': {'out': 0.0, 'in': 28000000.0}, 'NetIO': {'out': 0.0, 'in': 0.0}, 'CPUPerc': 0.00, 'MemPerc': 6.23, 'id': '33a22dcd4ba31ebc4a19fae865ee62285b6fae98a6ab72d2bc65e41cdc70e419', 'MemUsage_Limit': {'usage': 19587399.68, 'limit': 314572800.0}, 'name': 'prometheus'}}
        self.assertEqual(target_stats_info, stats_info)

    def test_convert_to_byte(self):
        self.assertEqual(380.4 * 2 ** 20, convert_to_byte("380.4MiB"))
        self.assertEqual(380.4 * 2 ** 20, convert_to_byte("380.4mib"))
        self.assertEqual(380.4 * 10 ** 6, convert_to_byte("380.4MB"))

    def test_parse_usage_limit(self):
        data = "380.4MiB / 55.03GiB"
        result = parse_usage_limit(data)
        target = {'usage': 380.4 * 2 ** 20, 'limit': 55.03 * 2 ** 30}
        self.assertEqual(target, result)

    def test_parse_io(self):
        data = "0B / 0B"
        result = parse_io(data)
        target = {'out': 0.0, 'in': 0.0}
        self.assertEqual(target, result)

    def test_parse_percentile(self):
        data = "24.45%"
        result = parse_percentile(data)
        target = 24.45
        self.assertEqual(target, result)

if __name__ == '__main__':
    unittest.main()
