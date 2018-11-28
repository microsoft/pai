#!/usr/bin/python
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
import sys
from xml.dom import minidom
import os
import logging

import utils
from utils import Metric

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

        result[str(minor)] = {"gpu_util": gpu_util, "gpu_mem_util": gpu_mem_util}

    return result

def collect_gpu_info():
    """ in some cases, nvidia-smi may block indefinitely, caller should be aware of this """
    driver_path = os.environ["NV_DRIVER"]
    bin_path = os.path.join(driver_path, "bin/nvidia-smi")
    try:
        logger.info("call %s to get gpu metrics", bin_path) # used to check if nvidia-smi hangs

        smi_output = utils.check_output([bin_path, "-q", "-x"])

        return parse_smi_xml_result(smi_output)
    except subprocess.CalledProcessError as e:
        if e.returncode == 127:
            logger.exception("nvidia cmd error. command '%s' return with error (code %d): %s",
                    e.cmd, e.returncode, e.output)
        else:
            logger.exception("command '%s' return with error (code %d): %s",
                    e.cmd, e.returncode, e.output)
    except OSError as e:
        logger.exception("nvidia-smi not found")

    return None


def convert_gpu_info_to_metrics(gpu_infos):
    if gpu_infos is None:
        return None

    result = [Metric("nvidiasmi_attached_gpus", {}, len(gpu_infos))]

    for minor, info in gpu_infos.items():
        label = {"minor_number": minor}
        result.append(Metric("nvidiasmi_utilization_gpu", label, info["gpu_util"]))
        result.append(Metric("nvidiasmi_utilization_memory", label, info["gpu_mem_util"]))

    return result


if __name__ == "__main__":
    print collect_gpu_info()
