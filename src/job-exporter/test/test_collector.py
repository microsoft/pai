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
import datetime
import time
import logging

import base

sys.path.append(os.path.abspath("../src/"))

import collector
from collector import ContainerCollector

logger = logging.getLogger(__name__)

class TestContainerCollector(base.TestBase):
    """
    Test ContainerCollector in collecotr.py
    """

    def test_parse_from_labels(self):
        labels = {"container_label_PAI_USER_NAME": "openmindstudio", "container_label_GPU_ID": "0,1,", "container_label_PAI_HOSTNAME": "paigcr-a-gpu-1058", "container_label_PAI_JOB_NAME": "trialslot_nnimain_d65bc5ac", "container_label_PAI_CURRENT_TASK_ROLE_NAME": "tuner"}
        gpuIds, otherLabels = ContainerCollector.parse_from_labels(labels)
        self.assertEqual(["0", "1"], gpuIds,)
        copied = copy.deepcopy(labels)
        copied.pop("container_label_GPU_ID")
        self.assertEqual(copied, otherLabels)

    def test_infer_service_name(self):
        self.assertIsNone(ContainerCollector.infer_service_name(
            "k8s_POD_alertmanager-7884c59f78-66r86_default_0a32e30a-f6ae-11e8"))

        self.assertEqual(
                "alertmanager",
                ContainerCollector.infer_service_name(
                    "k8s_alertmanager_alertmanager-7884c59f78-66r86_default_0a32e30a-f6ae-11e8-a62d-000d3ab25bb6_2"))

        self.assertIsNone(ContainerCollector.infer_service_name(
            "k8s_kube-scheduler_kube-scheduler-10.151.40.4_kube-system_f1164d931979939cf0601155df9c748a_6"))


class TestDockerCollector(base.TestBase):
    """
    Test DockerCollector in collector.py
    """

    def assert_metrics(self, metrics):
        self.assertEqual(1, len(metrics))
        self.assertEqual(1, len(metrics[0].samples))
        sample = metrics[0].samples[0]
        self.assertEqual(1, len(sample[1])) # label keys
        self.assertEqual(1, sample[2]) # sample value

    def test_impl(self):
        _, c = collector.instantiate_collector(
                "test_docker_collector1",
                0.5,
                collector.DockerCollector)

        self.assert_metrics(c.collect_impl())

    def test_base_collector(self):
        """ actually setup DockerCollector thread, and test, since this is multi-thread
        test case, maybe sensitive to the system load """
        ref = collector.make_collector(
                "test_docker_collector2",
                0.5,
                collector.DockerCollector)

        metrics = None
        for i in range(10):
            metrics = ref.get()
            if metrics is not None:
                break
            time.sleep(0.1)

        self.assert_metrics(metrics)


class TestZombieCollector(base.TestBase):
    """
    Test ZombieCollector in collector.py
    """
    def setUp(self):
        # Because prometheus forbid same metric name, and we generate metric
        # in from name, we need to differentiate name using time.
        t = str(time.time()).replace(".", "_")

        _, self.collector = collector.instantiate_collector(
                "test_zombie_collector" + t,
                0.5,
                collector.ZombieCollector,
                collector.AtomicRef())

    def test_update_zombie_count_type1(self):
        start = datetime.datetime.now()

        one_sec = datetime.timedelta(seconds=1)

        type1_recorder = self.collector.type1_zombies

        self.assertEqual(0,
                self.collector.update_zombie_count_type1({"a", "b"}, start))
        self.assertEqual(2, len(type1_recorder))

        self.assertEqual(0,
                self.collector.update_zombie_count_type1({"a", "b"},
                    start + type1_recorder.decay_time - one_sec))
        self.assertEqual(2, len(type1_recorder))

        self.assertEqual(2,
                self.collector.update_zombie_count_type1({"a", "b"},
                    start + type1_recorder.decay_time + one_sec))
        self.assertEqual(2, len(type1_recorder))

        self.assertEqual(1,
                self.collector.update_zombie_count_type1({"a"},
                    start + type1_recorder.decay_time + 2 *one_sec))
        self.assertEqual(1, len(type1_recorder))

        self.assertEqual(0,
                self.collector.update_zombie_count_type1({},
                    start + type1_recorder.decay_time + 3 * one_sec))
        self.assertEqual(0, len(type1_recorder))

    def test_update_zombie_count_type2(self):
        start = datetime.datetime.now()

        one_sec = datetime.timedelta(seconds=1)

        stats = {"43ffe701d883":
                    {"name": "core-caffe2_resnet50_20181012040921.586-container_e03_1539312078880_0780_01_000002"},
                "8de2f53e64cb":
                    {"name": "container_e03_1539312078880_0780_01_000002"}}

        type2_recorder = self.collector.type2_zombies

        self.assertEqual(0,
                self.collector.update_zombie_count_type2(stats, start))

        stats.pop("8de2f53e64cb")

        self.assertEqual(0,
                self.collector.update_zombie_count_type2(stats, start + one_sec))

        self.assertEqual(0,
                self.collector.update_zombie_count_type2(stats,
                    start + type2_recorder.decay_time))

        self.assertEqual(1,
                self.collector.update_zombie_count_type2(stats,
                    start + type2_recorder.decay_time + 2 * one_sec))

        stats.pop("43ffe701d883")

        self.assertEqual(0,
                self.collector.update_zombie_count_type2(stats,
                    start + type2_recorder.decay_time + 3 * one_sec))

if __name__ == '__main__':
    unittest.main()
