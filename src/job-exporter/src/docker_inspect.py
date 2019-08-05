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

class InspectResult(object):
    """ Represents a task meta data, parsed from docker inspect result """
    def __init__(self, username, job_name, role_name, task_index, gpu_ids, job_instance_id, pid):
        self.username = username
        self.job_name = job_name
        self.role_name = role_name
        self.task_index = task_index
        self.gpu_ids = gpu_ids # comma seperated str, str may be minor_number or UUID
        self.pid = pid
        self.job_instance_id = job_instance_id # Used to distinguish job instance with same name but different retry number.

    def __repr__(self):
        return "username %s, job_name %s, role_name %s, task_index %s, gpu_ids %s, job_instance_id %s pid %s" % \
                (self.username, self.job_name, self.role_name, self.task_index, self.gpu_ids, self.job_instance_id, self.pid)

    def __eq__(self, o):
        return self.username == o.username and \
                self.job_name == o.job_name and \
                self.role_name == o.role_name and \
                self.task_index == o.task_index and \
                self.gpu_ids == o.gpu_ids and \
                self.job_instance_id == o.job_instance_id and \
                self.pid == o.pid


keys = {"PAI_JOB_NAME", "PAI_USER_NAME", "PAI_CURRENT_TASK_ROLE_NAME", "GPU_ID",
        "PAI_TASK_INDEX", "DLWS_JOB_ID", "DLWS_USER_NAME"}


def parse_docker_inspect(inspect_output):
    obj = json.loads(inspect_output)

    m = {}

    obj_labels = utils.walk_json_field_safe(obj, 0, "Config", "Labels")
    if obj_labels is not None:
        for k, v in obj_labels.items():
            if k in keys:
                m[k] = v

    obj_env = utils.walk_json_field_safe(obj, 0, "Config", "Env")
    if obj_env:
        for env in obj_env:
            k, v = env.split("=", 1)
            if k in keys:
                m[k] = v

            # for kube-launcher tasks
            if k == "FC_TASK_INDEX":
                m["PAI_TASK_INDEX"] = v
            elif k == "NVIDIA_VISIBLE_DEVICES" and v != "all" and v != "void":
                m["GPU_ID"] = v
            
            if k == "FC_FRAMEWORK_ATTEMPT_INSTANCE_UID" or k == "APP_ID":
                m["JOB_INSTANCE_ID"] = v

    pid = utils.walk_json_field_safe(obj, 0, "State", "Pid")

    return InspectResult(
            m.get("PAI_USER_NAME") or m.get("DLWS_USER_NAME"),
            m.get("PAI_JOB_NAME") or m.get("DLWS_JOB_ID"),
            m.get("PAI_CURRENT_TASK_ROLE_NAME"),
            m.get("PAI_TASK_INDEX"),
            m.get("GPU_ID"),
            m.get("JOB_INSTANCE_ID"),
            pid)

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
