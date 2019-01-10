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
import json
import sys
import logging

import utils

logger = logging.getLogger(__name__)

target_label = {"PAI_HOSTNAME", "PAI_JOB_NAME", "PAI_USER_NAME", "PAI_CURRENT_TASK_ROLE_NAME", "GPU_ID"}
target_env = {"PAI_TASK_INDEX"}


def parse_docker_inspect(inspect_output):
    obj = json.loads(inspect_output)
    labels = {}
    envs = {}

    obj_labels = utils.walk_json_field_safe(obj, 0, "Config", "Labels")
    if obj_labels is not None:
        for key in obj_labels:
            if key in target_label:
                label_key = "container_label_{0}".format(key.replace(".", "_"))
                label_val = obj_labels[key]
                labels[label_key] = label_val

    obj_env = utils.walk_json_field_safe(obj, 0, "Config", "Env")
    if obj_env:
        for env in obj_env:
            env_item = env.split("=")
            if env_item[0] in target_env:
                key = "container_env_{0}".format(env_item[0].replace(".", "_"))
                val = env_item[1]
                envs[key] = val

    pid = utils.walk_json_field_safe(obj, 0, "State", "Pid")

    return {"env": envs, "labels": labels, "pid": pid}

def inspect(container_id, histogram, timeout):
    try:
        result = utils.exec_cmd(
                ["docker", "inspect", container_id],
                histogram=histogram,
                timeout=timeout)
        return parse_docker_inspect(result)
    except subprocess.CalledProcessError as e:
        logger.exception("command '%s' return with error (code %d): %s",
                e.cmd, e.returncode, e.output)
    except subprocess.TimeoutExpired:
        logger.warning("docker inspect timeout")
    except Exception:
        logger.exception("exec docker inspect error")
