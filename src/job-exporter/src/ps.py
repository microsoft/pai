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
import logging
import collections

import utils

logger = logging.getLogger(__name__)

def parse_result(ps):
    result = collections.defaultdict(lambda : 0)

    for line in ps.split("\n"):
        line = line.strip()
        if len(line) == 0:
            continue
        state = line[0]
        cmd = line[2:]
        if state == "D":
            if "nvidia-smi" in cmd:
                result["nvidia-smi"] += 1 # override command name to make alert rule easier
            else:
                cmd = cmd.split()[0] # remove args
                result[cmd] += 1

    return result

def get_zombie_process(histogram, timeout):
    try:
        ps_output = utils.exec_cmd(["ps", "ax", "--no-headers", "--format", "state,cmd"],
                histogram=histogram, timeout=timeout)

        return parse_result(ps_output)
    except subprocess.CalledProcessError as e:
        logger.exception("command '%s' return with error (code %d): %s",
                e.cmd, e.returncode, e.output)
    except subprocess.TimeoutExpired:
        logger.warning("ps aux timeout")
    except Exception:
        logger.exception("exec ps aux error")

    return None
