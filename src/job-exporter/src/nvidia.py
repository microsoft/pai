#!/usr/bin/env python3
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

import subprocess
from xml.dom import minidom
import os
import logging
import re

import utils

logger = logging.getLogger(__name__)

def convert_to_byte(data):
    data = data.lower()
    number = float(re.findall(r"[0-9.]+", data)[0])
    if "tb" in data:
        return number * 10 ** 12
    elif "gb" in data:
        return number * 10 ** 9
    elif "mb" in data:
        return number * 10 ** 6
    elif "kb" in data:
        return number * 10 ** 3
    elif "tib" in data:
        return number * 2 ** 40
    elif "gib" in data:
        return number * 2 ** 30
    elif "mib" in data:
        return number * 2 ** 20
    elif "kib" in data:
        return number * 2 ** 10
    else:
        return number


class EccError(object):
    """ EccError represents volatile count from one GPU card,
    see https://developer.download.nvidia.com/compute/DCGM/docs/nvidia-smi-367.38.pdf for more info """
    def __init__(self, volatile_single=0, volatile_double=0,
            aggregated_single=0, aggregated_double=0,
            single_retirement=0, double_retirement=0):
        self.volatile_single = volatile_single
        self.volatile_double = volatile_double
        self.aggregated_single = aggregated_single
        self.aggregated_double = aggregated_double
        self.single_retirement = single_retirement
        self.double_retirement = double_retirement

    def __repr__(self):
        return "v_s: %d, v_d: %d, a_s: %d, a_d: %d, s_r: %d, d_r: %d" % (\
                self.volatile_single, self.volatile_double,
                self.aggregated_single, self.aggregated_double,
                self.single_retirement, self.double_retirement)

    def __eq__(self, o):
        return self.volatile_single == o.volatile_single and \
                self.volatile_double == o.volatile_double and \
                self.aggregated_single == o.aggregated_single and \
                self.aggregated_double == o.aggregated_double and \
                self.single_retirement == o.single_retirement and \
                self.double_retirement == o.double_retirement


class NvidiaGpuStatus(object):
    """ This object represents status of one GPU card, field meaning:
        gpu_util the gpu util of this gpu, float number, range 0~100
        gpu_mem_util the gpu memory usage/total of this gpu, float number, range 0~100
        pids an array of pid numbers that uses this card
        ecc_errors instance of EccError class
        temperature will be None or float celsius """
    def __init__(self, gpu_util, gpu_mem_util, pids, ecc_errors, minor, uuid, temperature):
        self.gpu_util = gpu_util # float
        self.gpu_mem_util = gpu_mem_util # float
        self.pids = pids # list of int
        self.ecc_errors = ecc_errors # list of EccError
        self.minor = minor
        self.uuid = uuid # str
        self.temperature = temperature # None or float celsius

    def __repr__(self):
        return "util: %.3f, mem_util: %.3f, pids: %s, ecc: %s, minor: %s, uuid: %s, temperature %.3f" % \
                (self.gpu_util, self.gpu_mem_util, self.pids, self.ecc_errors, self.minor, self.uuid, self.temperature)

    def __eq__(self, o): # for test
        return self.gpu_util == o.gpu_util and \
                self.gpu_mem_util == o.gpu_mem_util and \
                self.pids == o.pids and \
                self.ecc_errors == o.ecc_errors and \
                self.minor == o.minor and \
                self.uuid == o.uuid and \
                self.temperature == o.temperature


def parse_smi_xml_result(smi):
    """ return a map, key is minor_number and gpu uuid, value is NvidiaGpuStatus """
    xmldoc = minidom.parseString(smi)
    gpus = xmldoc.getElementsByTagName("gpu")

    result = {}

    for gpu in gpus:
        minor = gpu.getElementsByTagName("minor_number")[0].childNodes[0].data
        utilization = gpu.getElementsByTagName("utilization")[0]

        gpu_util = utilization.getElementsByTagName("gpu_util")[0].childNodes[0].data.replace("%", "").strip()

        gpu_mem_util = "N/A"

        memory_usage_list = gpu.getElementsByTagName("fb_memory_usage")
        if len(memory_usage_list) != 0:
            memory_usage = memory_usage_list[0]
            mem_used = convert_to_byte(memory_usage.getElementsByTagName("used")[0].childNodes[0].data)
            mem_total = convert_to_byte(memory_usage.getElementsByTagName("total")[0].childNodes[0].data)

            if mem_total != 0:
                gpu_mem_util = mem_used / mem_total * 100

        if gpu_util == "N/A" or gpu_mem_util == "N/A":
            continue

        pids = []
        processes = gpu.getElementsByTagName("process_info")
        if len(processes) != 0:
            for process in processes:
                pids.append(int(
                    process.getElementsByTagName("pid")[0].childNodes[0].data))

        volatile_single = volatile_double = aggregated_single = aggregated_double = 0

        """Here we try to get the ecc error count.
        If there is no single_bit tag, it means that this GPU do not support
        """
        try:
            ecc_errors = gpu.getElementsByTagName("ecc_errors")
            volatile_single, volatile_double = get_ecc_error(ecc_errors, "volatile")
            aggregated_single, aggregated_double = get_ecc_error(ecc_errors, "aggregate")
        except IndexError:
            pass

        uuid = gpu.getElementsByTagName("uuid")[0].childNodes[0].data

        temperature = None
        try:
            temp_node = gpu.getElementsByTagName("temperature")
            if len(temp_node) > 0:
                temp_s = temp_node[0].getElementsByTagName("gpu_temp")[0].childNodes[0].data
                temperature = float(re.findall(r"[0-9.]+", temp_s)[0])
        except Exception:
            pass

        single_retirement = double_retirement = 0
        try:
            pages = gpu.getElementsByTagName("retired_pages")
            if len(pages) > 0:
                single = pages[0].getElementsByTagName("multiple_single_bit_retirement")[0]
                double = pages[0].getElementsByTagName("double_bit_retirement")[0]
                single = single.getElementsByTagName("retired_count")[0].childNodes[0].data
                double = double.getElementsByTagName("retired_count")[0].childNodes[0].data
                if single != "N/A":
                    single_retirement = int(single)
                if double != "N/A":
                    double_retirement = int(double)
        except Exception:
            pass

        status = NvidiaGpuStatus(
                float(gpu_util),
                float(gpu_mem_util),
                pids,
                EccError(volatile_single=volatile_single, volatile_double=volatile_double,
                    aggregated_single=aggregated_single, aggregated_double=aggregated_double,
                    single_retirement=single_retirement, double_retirement=double_retirement),
                str(minor),
                uuid,
                temperature)

        result[str(minor)] = result[uuid] = status

    return result

def get_ecc_error(ecc_errors, error_type):
    ecc_single, ecc_double = 0, 0
    volatile = ecc_errors[0].getElementsByTagName(error_type)
    if len(volatile) > 0:
        volatile = volatile[0]
        single = volatile.getElementsByTagName("single_bit")[0].getElementsByTagName("total")[0]
        double = volatile.getElementsByTagName("double_bit")[0].getElementsByTagName("total")[0]
        single = single.childNodes[0].data
        double = double.childNodes[0].data
        if single != "N/A":
            ecc_single = int(single)
        if double != "N/A":
            ecc_double = int(double)
    return ecc_single, ecc_double

def nvidia_smi(histogram, timeout):
    try:
        smi_output = utils.exec_cmd(["nvidia-smi", "-q", "-x"],
                histogram=histogram, timeout=timeout)

        return parse_smi_xml_result(smi_output)
    except subprocess.CalledProcessError as e:
        logger.exception("command '%s' return with error (code %d): %s",
                e.cmd, e.returncode, e.output)
    except subprocess.TimeoutExpired:
        logger.warning("nvidia-smi timeout")
    except Exception:
        logger.exception("exec nvidia-smi error")

    return None

def construct_gpu_info(statuses):
    """ util for unit test case """
    m = {}
    for status in statuses:
        m[status.minor] = status
        m[status.uuid] = status

    return m
