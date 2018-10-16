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
import copy
import unittest
import yaml
import logging
import logging.config
import datetime

sys.path.append(os.path.abspath("../src/"))

import job_exporter

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

        configuration_path = "logging.yaml"

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

    def test_parse_from_labels(self):
        labels = {"container_label_PAI_USER_NAME": "openmindstudio", "container_label_GPU_ID": "0,1,", "container_label_PAI_HOSTNAME": "paigcr-a-gpu-1058", "container_label_PAI_JOB_NAME": "trialslot_nnimain_d65bc5ac", "container_label_PAI_CURRENT_TASK_ROLE_NAME": "tuner"}
        gpuIds, otherLabels = job_exporter.parse_from_labels(labels)
        self.assertEqual(["0", "1"], gpuIds,)
        copied = copy.deepcopy(labels)
        copied.pop("container_label_GPU_ID")
        self.assertEqual(copied, otherLabels)

    def test_generate_zombie_count_type1(self):
        zombies = job_exporter.ZombieRecorder()

        start = datetime.datetime.now()

        one_sec = datetime.timedelta(seconds=1)

        self.assertEqual(0,
                job_exporter.generate_zombie_count_type1(zombies, {"a", "b"}, start))
        self.assertEqual(2, len(zombies))

        self.assertEqual(0,
                job_exporter.generate_zombie_count_type1(zombies, {"a", "b"},
                    start + zombies.decay_time - one_sec))
        self.assertEqual(2, len(zombies))

        self.assertEqual(2,
                job_exporter.generate_zombie_count_type1(zombies, {"a", "b"},
                    start + zombies.decay_time + one_sec))
        self.assertEqual(2, len(zombies))

        self.assertEqual(1,
                job_exporter.generate_zombie_count_type1(zombies, {"a"},
                    start + zombies.decay_time + 2 *one_sec))
        self.assertEqual(1, len(zombies))

        self.assertEqual(0,
                job_exporter.generate_zombie_count_type1(zombies, {},
                    start + zombies.decay_time + 3 * one_sec))
        self.assertEqual(0, len(zombies))


    def test_generate_zombie_count_type2(self):
        zombies = job_exporter.ZombieRecorder()

        start = datetime.datetime.now()

        one_sec = datetime.timedelta(seconds=1)

        stats = {"43ffe701d883":
                    {"name": "core-caffe2_resnet50_20181012040921.586-container_e03_1539312078880_0780_01_000002"},
                "8de2f53e64cb":
                    {"name": "container_e03_1539312078880_0780_01_000002"}}

        self.assertEqual(0,
                job_exporter.generate_zombie_count_type2(zombies, stats, start))

        stats.pop("8de2f53e64cb")

        self.assertEqual(0,
                job_exporter.generate_zombie_count_type2(zombies, stats, start + one_sec))

        self.assertEqual(0,
                job_exporter.generate_zombie_count_type2(zombies, stats,
                    start + zombies.decay_time))

        self.assertEqual(1,
                job_exporter.generate_zombie_count_type2(zombies, stats,
                    start + zombies.decay_time + 2 * one_sec))

        stats.pop("43ffe701d883")

        self.assertEqual(0,
                job_exporter.generate_zombie_count_type2(zombies, stats,
                    start + zombies.decay_time + 3 * one_sec))

if __name__ == '__main__':
    unittest.main()
