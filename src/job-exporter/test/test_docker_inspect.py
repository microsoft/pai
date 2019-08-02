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

import base

sys.path.append(os.path.abspath("../src/"))

from docker_inspect import parse_docker_inspect, InspectResult

class TestDockerInspect(base.TestBase):
    """
    Test docker_inspect.py
    """

    def test_parse_docker_inspect(self):
        sample_path = "data/docker_inspect_sample.json"
        with open(sample_path, "r") as f:
            docker_inspect = f.read()

        inspect_info = parse_docker_inspect(docker_inspect)
        target_inspect_info = InspectResult(
                "openmindstudio",
                "trialslot_nnimain_d65bc5ac",
                "tuner",
                "0",
                "0,1,",
                "application_1522829300813_1943",
                95539)

        self.assertEqual(target_inspect_info, inspect_info)

    def test_parse_docker_inspect_kube(self):
        sample_path = "data/docker_inspect_kube_launcher_task.json"
        with open(sample_path, "r") as f:
            docker_inspect = f.read()

        inspect_info = parse_docker_inspect(docker_inspect)
        target_inspect_info = InspectResult(
                "core",
                "core~tensorflowcifar10",
                "worker",
                "0",
                "GPU-dc0671b0-61a4-443e-f456-f8fa6359b788",
                "0_69c05215-46fa-11e9-8937-000d3ab38724",
                23774)
        self.assertEqual(target_inspect_info, inspect_info)

    def test_parse_docker_inspect_BUGFIX(self):
        sample_path = "data/inspect_result_bug_fix.json"
        with open(sample_path, "r") as f:
            docker_inspect = f.read()

        inspect_info = parse_docker_inspect(docker_inspect)
        target_inspect_info = InspectResult(
                "sokoya",
                "sokoya~train-exp_offrl_sc_discard_0231-10th-beta07-lrfixed_13e9bf5_gCYv",
                "train",
                "0",
                "3,2,1,0",
                "application_1553664769226_0080",
                30332)
        self.assertEqual(target_inspect_info, inspect_info)

    def test_adapt_dlts_jobs(self):
        sample_path = "data/dlts_docker_inspect.json"
        with open(sample_path, "r") as f:
            docker_inspect = f.read()

        inspect_info = parse_docker_inspect(docker_inspect)
        target_inspect_info = InspectResult(
                "dixu",
                "0c435eee-d31f-43d5-a1b3-442845fa1d0c",
                None,
                None,
                "GPU-7c583998-b3ff-a885-8979-2d32d334cde4",
                None,
                3533)
        self.assertEqual(target_inspect_info, inspect_info)

if __name__ == '__main__':
    unittest.main()
