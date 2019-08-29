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
import datetime
import time
import logging

import base

sys.path.append(os.path.abspath("../src/"))

import collector
import nvidia
import docker_inspect
from collector import ContainerCollector
from collector import GpuCollector

logger = logging.getLogger(__name__)

class TestContainerCollector(base.TestBase):
    """
    Test ContainerCollector in collecotr.py
    """

    def test_parse_from_labels(self):
        inspect_result = docker_inspect.InspectResult(
                "openmindstudio",
                "trialslot_nnimain_d65bc5ac",
                "tuner",
                "0",
                "this_is_pod_name_val",
                "0,1,",
                12345,
                "dixu@example.com",
                "platform",
                )

        gpu_ids, labels = ContainerCollector.parse_from_labels(inspect_result, None)
        self.assertEqual(["0", "1"], gpu_ids)

        target_labels = {
                "username": "openmindstudio",
                "job_name": "trialslot_nnimain_d65bc5ac",
                "role_name": "tuner",
                "task_index": "0",
                "pod_name": "this_is_pod_name_val",
                "user_email": "dixu@example.com",
                "vc_name": "platform",
                }

        self.assertEqual(target_labels, labels)

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
                datetime.timedelta(seconds=1),
                collector.DockerCollector)

        self.assert_metrics(c.collect_impl())

    def test_base_collector(self):
        """ actually setup DockerCollector thread, and test, since this is multi-thread
        test case, maybe sensitive to the system load """
        ref = collector.make_collector(
                "test_docker_collector2",
                0.5,
                datetime.timedelta(seconds=10),
                collector.DockerCollector)

        metrics = None
        for i in range(20):
            metrics = ref.get(datetime.datetime.now())
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

        decay_time = datetime.timedelta(seconds=1)
        _, self.collector = collector.instantiate_collector(
                "test_zombie_collector" + t,
                0.5,
                decay_time,
                collector.ZombieCollector,
                collector.AtomicRef(decay_time),
                collector.AtomicRef(decay_time))

    def test_update_zombie_count_type1(self):
        start = datetime.datetime.now()

        one_sec = datetime.timedelta(seconds=1)

        type1_recorder = self.collector.type1_zombies

        self.assertEqual(set(),
                self.collector.update_zombie_count_type1({"a", "b"}, start))
        self.assertEqual(2, len(type1_recorder))

        self.assertEqual(set(),
                self.collector.update_zombie_count_type1({"a", "b"},
                    start + type1_recorder.decay_time - one_sec))
        self.assertEqual(2, len(type1_recorder))

        self.assertEqual({"a", "b"},
                self.collector.update_zombie_count_type1({"a", "b"},
                    start + type1_recorder.decay_time + one_sec))
        self.assertEqual(2, len(type1_recorder))

        self.assertEqual({"a"},
                self.collector.update_zombie_count_type1({"a"},
                    start + type1_recorder.decay_time + 2 *one_sec))
        self.assertEqual(1, len(type1_recorder))

        self.assertEqual(set(),
                self.collector.update_zombie_count_type1({},
                    start + type1_recorder.decay_time + 3 * one_sec))
        self.assertEqual(0, len(type1_recorder))

    def test_update_zombie_count_type2(self):
        start = datetime.datetime.now()

        one_sec = datetime.timedelta(seconds=1)

        stats = {"43ffe701d883":
                    {"name": "core-caffe2_resnet50_20181012040921.586-container_e03_1539312078880_0780_01_000002", "id": "43ffe701d883"},
                "8de2f53e64cb":
                {"name": "container_e03_1539312078880_0780_01_000002", "id": "8de2f53e64cb"}}

        type2_recorder = self.collector.type2_zombies

        self.assertEqual(set(),
                self.collector.update_zombie_count_type2(stats, start))

        stats.pop("8de2f53e64cb")

        self.assertEqual(set(),
                self.collector.update_zombie_count_type2(stats, start + one_sec))

        self.assertEqual(set(),
                self.collector.update_zombie_count_type2(stats,
                    start + type2_recorder.decay_time))

        self.assertEqual({"43ffe701d883"},
                self.collector.update_zombie_count_type2(stats,
                    start + type2_recorder.decay_time + 2 * one_sec))

        stats.pop("43ffe701d883")

        self.assertEqual(set(),
                self.collector.update_zombie_count_type2(stats,
                    start + type2_recorder.decay_time + 3 * one_sec))

class TestGpuCollector(base.TestBase):
    """
    Test GpuCollector in collecotr.py
    """

    def make_pid_to_cid_fn(self, mapping):
        def fn(pid):
            if pid in mapping:
                return True, mapping[pid]
            return False, ""
        return fn

    def test_convert_to_metrics(self):
        # sample may not ordered, and can not assertEqual directly, so tear them apart
        gpu_info = nvidia.construct_gpu_info(
                [nvidia.NvidiaGpuStatus(20, 21, [22, 33, 44], nvidia.EccError(), "0", "GPU-uuid0", 37.0)])

        zombie_info = {"abc", "def"}

        pid_to_cid_mapping = {33: "def", 22: "ghi"} # only 33 is zombie

        metrics = GpuCollector.convert_to_metrics(gpu_info, zombie_info,
                self.make_pid_to_cid_fn(pid_to_cid_mapping), 20 * 1024)

        core_utils, mem_utils, ecc_errors, mem_leak, external_process, zombie_container, gpu_temp, gpu_retired = metrics

        target_core_utils = collector.gen_gpu_util_gauge()
        target_core_utils.add_metric(["0"], 20)
        self.assertEqual(target_core_utils, core_utils)

        target_mem_utils = collector.gen_gpu_mem_util_gauge()
        target_mem_utils.add_metric(["0"], 21)
        self.assertEqual(target_mem_utils, mem_utils)

        target_ecc_errors = collector.gen_gpu_ecc_counter()
        target_ecc_errors.add_metric(["0", "volatile_single"], 0)
        target_ecc_errors.add_metric(["0", "volatile_double"], 0)
        target_ecc_errors.add_metric(["0", "aggregated_single"], 0)
        target_ecc_errors.add_metric(["0", "aggregated_double"], 0)
        self.assertEqual(target_ecc_errors, ecc_errors)

        target_mem_leak = collector.gen_gpu_memory_leak_counter()
        self.assertEqual(target_mem_leak, mem_leak)

        target_external_process = collector.gen_gpu_used_by_external_process_counter()
        target_external_process.add_metric(["0", "44"], 1)
        self.assertEqual(target_external_process, external_process)

        target_zombie_container = collector.gen_gpu_used_by_zombie_container_counter()
        target_zombie_container.add_metric(["0", "def"], 1)
        self.assertEqual(target_zombie_container, zombie_container)

        target_gpu_temp = collector.gen_gpu_temperature_gauge()
        target_gpu_temp.add_metric(["0"], 37.0)
        self.assertEqual(target_gpu_temp, gpu_temp)

        # test minor 1
        gpu_info = nvidia.construct_gpu_info([
            nvidia.NvidiaGpuStatus(30, 31, [55, 123], nvidia.EccError(volatile_single=2, volatile_double=3, aggregated_single=4, aggregated_double=5), "1", "GPU-uuid1", 24.0)])

        metrics = GpuCollector.convert_to_metrics(gpu_info, zombie_info,
                self.make_pid_to_cid_fn(pid_to_cid_mapping), 20 * 1024)

        core_utils, mem_utils, ecc_errors, mem_leak, external_process, zombie_container, gpu_temp, gpu_retired = metrics

        target_core_utils = collector.gen_gpu_util_gauge()
        target_core_utils.add_metric(["1"], 30)
        self.assertEqual(target_core_utils, core_utils)

        target_mem_utils = collector.gen_gpu_mem_util_gauge()
        target_mem_utils.add_metric(["1"], 31)
        self.assertEqual(target_mem_utils, mem_utils)

        target_ecc_errors = collector.gen_gpu_ecc_counter()
        target_ecc_errors.add_metric(["1", "volatile_single"], 2)
        target_ecc_errors.add_metric(["1", "volatile_double"], 3)
        target_ecc_errors.add_metric(["1", "aggregated_single"], 4)
        target_ecc_errors.add_metric(["1", "aggregated_double"], 5)
        self.assertEqual(target_ecc_errors, ecc_errors)

        target_mem_leak = collector.gen_gpu_memory_leak_counter()
        self.assertEqual(target_mem_leak, mem_leak)

        target_external_process = collector.gen_gpu_used_by_external_process_counter()
        target_external_process.add_metric(["1", "55"], 1)
        target_external_process.add_metric(["1", "123"], 1)
        self.assertEqual(target_external_process, external_process)

        target_zombie_container = collector.gen_gpu_used_by_zombie_container_counter()
        self.assertEqual(target_zombie_container, zombie_container)

        target_gpu_temp = collector.gen_gpu_temperature_gauge()
        target_gpu_temp.add_metric(["1"], 24.0)
        self.assertEqual(target_gpu_temp, gpu_temp)

        # test minor 2
        gpu_info = nvidia.construct_gpu_info([
            nvidia.NvidiaGpuStatus(40, 20 * 1024 * 1024, [], nvidia.EccError(), "2", "GPU-uuid2", 30.0)])

        metrics = GpuCollector.convert_to_metrics(gpu_info, zombie_info,
                self.make_pid_to_cid_fn(pid_to_cid_mapping), 20 * 1024 * 1024)

        core_utils, mem_utils, ecc_errors, mem_leak, external_process, zombie_container, gpu_temp, gpu_retired = metrics

        target_core_utils = collector.gen_gpu_util_gauge()
        target_core_utils.add_metric(["2"], 40)
        self.assertEqual(target_core_utils, core_utils)

        target_mem_utils = collector.gen_gpu_mem_util_gauge()
        target_mem_utils.add_metric(["2"], 20 * 1024 * 1024)
        self.assertEqual(target_mem_utils, mem_utils)

        target_ecc_errors = collector.gen_gpu_ecc_counter()
        target_ecc_errors.add_metric(["2", "volatile_single"], 0)
        target_ecc_errors.add_metric(["2", "volatile_double"], 0)
        target_ecc_errors.add_metric(["2", "aggregated_single"], 0)
        target_ecc_errors.add_metric(["2", "aggregated_double"], 0)
        self.assertEqual(target_ecc_errors, ecc_errors)

        target_mem_leak = collector.gen_gpu_memory_leak_counter()
        self.assertEqual(target_mem_leak, mem_leak)

        target_external_process = collector.gen_gpu_used_by_external_process_counter()
        self.assertEqual(target_external_process, external_process)

        target_zombie_container = collector.gen_gpu_used_by_zombie_container_counter()
        self.assertEqual(target_zombie_container, zombie_container)

        target_gpu_temp = collector.gen_gpu_temperature_gauge()
        target_gpu_temp.add_metric(["2"], 30.0)
        self.assertEqual(target_gpu_temp, gpu_temp)

        # test memory leak
        gpu_info = nvidia.construct_gpu_info([
            nvidia.NvidiaGpuStatus(40, 20 * 1024 * 1024 + 1, [], nvidia.EccError(), "3", "GPU-uuid3", 30.0)])

        metrics = GpuCollector.convert_to_metrics(gpu_info, zombie_info,
                self.make_pid_to_cid_fn(pid_to_cid_mapping), 20 * 1024)

        core_utils, mem_utils, ecc_errors, mem_leak, external_process, zombie_container, gpu_temp, gpu_retired = metrics

        target_mem_leak = collector.gen_gpu_memory_leak_counter()
        target_mem_leak.add_metric(["3"], 1)
        self.assertEqual(target_mem_leak, mem_leak)

    def test_convert_to_metrics_with_no_zombie_info_BUGFIX(self):
        gpu_info = nvidia.construct_gpu_info([
            nvidia.NvidiaGpuStatus(20, 21, [22, 33, 44], nvidia.EccError(), "0", "GPU-uuid0", 40.0)])

        # zombie_info is empty should also have external process metric
        zombie_info = []

        pid_to_cid_mapping = {33: "def", 22: "ghi"} # only 44 is external process

        metrics = GpuCollector.convert_to_metrics(gpu_info, zombie_info,
                self.make_pid_to_cid_fn(pid_to_cid_mapping), 20 * 1024)

        core_utils, mem_utils, ecc_errors, mem_leak, external_process, zombie_container, gpu_temp, gpu_retired = metrics

        self.assertEqual(0, len(zombie_container.samples))
        self.assertEqual(1, len(external_process.samples))
        self.assertEqual("0", external_process.samples[0].labels["minor_number"])
        self.assertEqual("44", external_process.samples[0].labels["pid"])

        # zombie_info is None should also have external process metric
        zombie_info = None

        metrics = GpuCollector.convert_to_metrics(gpu_info, zombie_info,
                self.make_pid_to_cid_fn(pid_to_cid_mapping), 20 * 1024)

        core_utils, mem_utils, ecc_errors, mem_leak, external_process, zombie_container, gpu_temp, gpu_retired = metrics

        self.assertEqual(0, len(zombie_container.samples))
        self.assertEqual(1, len(external_process.samples))
        self.assertEqual("0", external_process.samples[0].labels["minor_number"])
        self.assertEqual("44", external_process.samples[0].labels["pid"])

    def test_convert_to_metrics_with_real_id_BUGFIX(self):
        gpu_info = nvidia.construct_gpu_info([
            nvidia.NvidiaGpuStatus(20, 21, [22], nvidia.EccError(), "0", "GPU-uuid0", 50.0)])

        # zombie_info is empty should also have external process metric
        zombie_info = {"ce5de12d6275"}

        pid_to_cid_mapping = {22: "ce5de12d6275dc05c9ec5b7f58484f075f4775d8f54f6a4be3dc1439344df356"}

        metrics = GpuCollector.convert_to_metrics(gpu_info, zombie_info,
                self.make_pid_to_cid_fn(pid_to_cid_mapping), 20 * 1024)

        core_utils, mem_utils, ecc_errors, mem_leak, external_process, zombie_container, gpu_temp, gpu_retired = metrics

        self.assertEqual(1, len(zombie_container.samples))
        self.assertEqual("0", zombie_container.samples[0].labels["minor_number"])
        self.assertEqual("ce5de12d6275", zombie_container.samples[0].labels["container_id"])

class TestAtomicRef(base.TestBase):
    """
    Test AtomicRef in collecotr.py
    """

    def test_expiration(self):
        ref = collector.AtomicRef(datetime.timedelta(seconds=10))

        now = datetime.datetime.now()

        delta = datetime.timedelta(seconds=1)

        ref.set(1, now)

        self.assertEquals(1, ref.get(now))
        self.assertEquals(1, ref.get(now - delta))
        self.assertEquals(1, ref.get(now + delta))
        self.assertEquals(1, ref.get(now + delta * 10))
        self.assertEquals(None, ref.get(now + delta * 11))
        self.assertEquals(1, ref.get(now + delta * 10))

        ref.set(2, now + delta)
        self.assertEquals(2, ref.get(now))
        self.assertEquals(2, ref.get(now + delta * 10))
        self.assertEquals(2, ref.get(now + delta * 11))
        self.assertEquals(None, ref.get(now + delta * 12))


if __name__ == '__main__':
    unittest.main()
