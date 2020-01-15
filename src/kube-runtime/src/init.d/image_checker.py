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

import argparse
import http
import logging
import os
import re
import sys

import requests
import yaml

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from common.utils import init_logger  #pylint: disable=wrong-import-position

LOGGER = logging.getLogger(__name__)


def _is_docker_hub_uri(uri):
    if re.fullmatch(r"(?:[a-z\-_.0-9]+\/)?[a-z\-_.0-9]+(?::[a-z\-_.0-9]+)?",
                    uri):
        return True
    return False


def _get_docker_repository_name(image_name):
    paths = image_name.split("/")
    if len(paths) == 1:
        return "library/{}".format(paths[0])
    return image_name


def _is_docker_image_valid(job_config):
    prerequisites = job_config["prerequisites"]

    task_role_name = os.getenv("PAI_CURRENT_TASK_ROLE_NAME")
    task_role = job_config["taskRoles"][task_role_name]
    docker_image_name = task_role["dockerImage"]

    docker_images = list(
        filter(lambda pre: pre["name"] == docker_image_name, prerequisites))
    assert len(docker_images) == 1
    image_info = docker_images[0]

    if "auth" in image_info:
        LOGGER.info("skip checking docker image with auth info")
        return True

    if not _is_docker_hub_uri(image_info["uri"]):
        LOGGER.info("Not use docker hub as registry, ignore checking")
        return True

    arr = image_info["uri"].split(":")
    if len(arr) == 1:
        uri = "http://hub.docker.com/v2/repositories/{}".format(
            _get_docker_repository_name(arr[0]))
    elif len(arr) == 2:
        uri = "http://hub.docker.com/v2/repositories/{}/tags/{}".format(
            _get_docker_repository_name(arr[0]), arr[1])
    else:
        LOGGER.ERROR("Maybe docker uri is invalid")
        return False
    res = requests.get(uri)
    if res.status_code != http.HTTPStatus.OK:
        LOGGER.error(
            "Failed to get docker image info from docker hub, resp: %s",
            res.text)
        return False
    return True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("job_config", help="job config yaml")
    args = parser.parse_args()

    LOGGER.info("get job config from %s", args.job_config)
    with open(args.job_config) as f:
        job_config = yaml.safe_load(f)
        if not _is_docker_image_valid(job_config):
            sys.exit(1)


if __name__ == "__main__":
    init_logger()
    main()
