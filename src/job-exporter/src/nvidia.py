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

def parse_smi_xml_result(smi):
    xmldoc = minidom.parseString(smi)
    gpus = xmldoc.getElementsByTagName('gpu')

    result = {}

    for gpu in gpus:
        minor = gpu.getElementsByTagName('minor_number')[0].childNodes[0].data
        utilization = gpu.getElementsByTagName("utilization")[0]

        gpu_util = utilization.getElementsByTagName('gpu_util')[0].childNodes[0].data.replace("%", "").strip()

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

        result[str(minor)] = {"gpu_util": float(gpu_util), "gpu_mem_util": float(gpu_mem_util)}

    return result

def nvidia_smi(histogram, timeout):
    driver_path = os.environ["NV_DRIVER"]
    bin_path = os.path.join(driver_path, "bin/nvidia-smi")

    try:
        smi_output = utils.exec_cmd([bin_path, "-q", "-x"],
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
