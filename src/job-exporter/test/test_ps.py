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

import ps

class TestPS(base.TestBase):
    """
    Test ps.py
    """
    def test_parse_ps_result(self):
        sample_path = "data/ps_sample.txt"
        with open(sample_path, "r") as f:
            ps_result = f.read()
        parse_result = ps.parse_result(ps_result)

        self.assertEqual(4, len(parse_result))
        self.assertEqual("D", parse_result[0].state)
        self.assertEqual("4", parse_result[0].pid)
        self.assertEqual(2 * 1024, parse_result[0].rss)
        self.assertEqual("/var/drivers/nvidia/current/bin/nvidia-smi -q -x",
                parse_result[0].cmd)

if __name__ == '__main__':
    unittest.main()
