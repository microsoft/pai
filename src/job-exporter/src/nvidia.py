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

import utils

logger = logging.getLogger(__name__)

def parse_smi_xml_result(smi):
    xmldoc = minidom.parseString(smi)
    gpus = xmldoc.getElementsByTagName('gpu')

    result = {}

    for gpu in gpus:
        minor = gpu.getElementsByTagName('minor_number')[0].childNodes[0].data
        utilization = gpu.getElementsByTagName("utilization")[0]

        gpu_util = utilization.getElementsByTagName('gpu_util')[0].childNodes[0].data.replace("%", "").strip()
        gpu_mem_util = utilization.getElementsByTagName('memory_util')[0].childNodes[0].data.replace("%", "").strip()

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
