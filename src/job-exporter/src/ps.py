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

import utils

logger = logging.getLogger(__name__)

class ProcessInfo(object):
    def __init__(self, pid, state, rss, cmd):
        """ pid is string type, rss is a number in byte """
        self.pid = pid
        self.state = state
        self.rss = rss
        self.cmd = cmd

def parse_result(ps):
    result = []

    for line in ps.split("\n"):
        line = line.strip()
        if len(line) == 0:
            continue
        parts = line.split()
        state = parts[0]
        rss = int(parts[1]) * 1024
        pid = parts[2]
        cmd = " ".join(parts[3:])
        result.append(ProcessInfo(pid, state, rss, cmd))

    return result

def get_process_info(histogram, timeout):
    try:
        ps_output = utils.exec_cmd(["ps", "ax", "--no-headers", "--format", "state,rss,pid,cmd"],
                histogram=histogram, timeout=timeout)

        return parse_result(ps_output)
    except subprocess.CalledProcessError as e:
        logger.exception("command '%s' return with error (code %d): %s",
                e.cmd, e.returncode, e.output)
    except subprocess.TimeoutExpired:
        logger.warning("ps ax timeout")
    except Exception:
        logger.exception("exec ps ax error")

    return []
