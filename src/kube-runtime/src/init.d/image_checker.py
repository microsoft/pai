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
import base64
import copy
import http
import logging
import os
import sys

import requests
import yaml

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from common.utils import init_logger  #pylint: disable=wrong-import-position

LOGGER = logging.getLogger(__name__)

# The workflow:
# 1. try v2 function, if not v2 support, ignore
# 2. use WWW-Authenticate to get auth method if schema is Bearer
# 3. get token by modify the request
# 4. Try to get image manifest, use HEAD, don't need response body

BEARER_AUTH = "Bearer"
BASIC_AUTH = "Basic"


class ImageChecker():
    def __init__(self, job_config, secret):
        prerequisites = job_config["prerequisites"]
        task_role_name = os.getenv("PAI_CURRENT_TASK_ROLE_NAME")
        task_role = job_config["taskRoles"][task_role_name]
        docker_image_name = task_role["dockerImage"]

        docker_images = list(
            filter(lambda pre: pre["name"] == docker_image_name,
                   prerequisites))
        assert len(docker_images) == 1
        image_info = docker_images[0]

        self.image_uri = image_info["uri"]
        self.registry_uri = "https://index.docker.io/v2/"
        self.basic_auth_headers = {}
        self.bearer_auth_headers = {}
        self.registry_auth_type = BASIC_AUTH

        if "auth" in image_info:
            auth = image_info["auth"]
            self._init_auth_info(auth, secret, self.image_uri)

    def _init_auth_info(self, auth, secret, image_uri) -> None:
        if "registryuri" in auth:
            self.registry_uri = self._get_registry_uri(auth["registryuri"],
                                                       image_uri)
        username = auth["username"] if "username" in auth else ""
        password = secret[auth["password"]] if "password" in auth and auth[
            "password"] in secret else ""
        if username and password:
            basic_auth_token = base64.b64decode("{}:{}".format(
                username, password)).decode()
            self.basic_auth_headers["Authorization"] = "{} {}".format(
                BASIC_AUTH, basic_auth_token)

    def _get_registry_uri(self, uri, image_uri) -> str:
        ret_uri = uri.strip().rstrip("/")
        chunks = image_uri.split("/")
        if ret_uri.lstrip("http://") != chunks[0] and ret_uri.lstrip(
                "http://") != chunks[0]:
            LOGGER.info("Using default registry")
            return self.registry_uri

        if not ret_uri.startswith("http") and not ret_uri.startswith("https"):
            ret_uri = "https://{}".format(ret_uri)
        chunks = ret_uri.split('/')
        api_version_str = chunks[-1]
        if api_version_str == "v1" or api_version_str == "v2":
            ret_uri = "/".join(chunks[:-1])
        ret_uri = ret_uri.rstrip("/") + "/v2/"
        return ret_uri

    # Parse the challenge field, refer to: https://tools.ietf.org/html/rfc6750#section-3
    def _parse_auth_challenge(self, challenge) -> dict:
        if not challenge.strip().startswith(BEARER_AUTH):
            LOGGER.info("Challenge not supported, ignore this")
            return {}

        chunks = challenge.strip().split(",")
        challenge_dir = {}
        for chunk in chunks:
            pair = chunk.strip().split("=")
            challenge_dir[pair[0]] = pair[1].strip("\"")
        return challenge_dir

    def _get_and_set_token(self, challenge):
        if not challenge:
            return
        if "realm" not in challenge:
            LOGGER.warning("realm not in challenge, use basic auth")
            return
        url = challenge["realm"]
        paramters: dict = copy.deepcopy(challenge)
        del paramters["realm"]
        resp = requests.get(url,
                            headers=self.basic_auth_headers,
                            params=paramters)
        if not resp.ok:
            raise RuntimeError(
                "Failed to get auth token, status code: {}".format(
                    resp.status_code))
        body = resp.json()
        self.bearer_auth_headers = "{} {}".format(BEARER_AUTH, body["token"])
        self.registry_auth_type = BEARER_AUTH

    def _is_registry_v2_supportted(self) -> bool:
        try:
            resp = requests.head(self.registry_uri,
                                 headers=self.basic_auth_headers,
                                 timeout=10)
            if resp.ok or resp.status_code == http.HTTPStatus.UNAUTHORIZED:
                return True
            return False
        except (TimeoutError, ConnectionError):
            return False

    def _login_v2_registry(self) -> None:
        if not self._is_registry_v2_supportted():
            LOGGER.warning(
                "Registry %s not support v2 api, ignore image check",
                self.registry_uri)
            return
        resp = requests.head(self.registry_uri,
                             headers=self.basic_auth_headers)
        if not resp.ok:
            LOGGER.error("Failed to login registry, resp code is %d",
                         resp.status_code)
            raise RuntimeError("Failed to login registry")
        headers = resp.headers
        if "Www-Authenticate" in headers:
            challenge = self._parse_auth_challenge(headers["Www-Authenticate"])
            self._get_and_set_token(challenge)

    def is_docker_image_accessible(self):
        if self.registry_auth_type == BEARER_AUTH:
            resp = requests.head(self.registry_uri,
                                 headers=self.bearer_auth_headers)
        else:
            resp = requests.head(self.registry_auth_type,
                                 headers=self.basic_auth_headers)
        if resp.ok:
            LOGGER.info("image %s found in registry", self.image_uri)
            return True
        if resp.status_code == http.HTTPStatus.NOT_FOUND or resp.status_code == http.HTTPStatus.UNAUTHORIZED:
            LOGGER.info(
                "image %s not found or user unauthorized, registry is %s, resp code is %d",
                self.image_uri, self.registry_uri, resp.status_code)
            return False
        LOGGER.warning("resp with code %d, ignore image check",
                       resp.status_code)
        raise RuntimeError("Unknown response from registry")


def _get_docker_repository_name(image_name) -> str:
    paths = image_name.split("/")
    if len(paths) == 1:
        return "library/{}".format(paths[0])
    return image_name


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("job_config", help="job config yaml")
    parser.add_argument("secret_file", help="secret file path")
    args = parser.parse_args()

    LOGGER.info("get job config from %s", args.job_config)
    with open(args.job_config) as config, open(args.secret_file) as secret:
        job_config = yaml.safe_load(config)
        job_secret = yaml.safe_load(secret)

        image_checker = ImageChecker(job_config, job_secret)
        try:
            if not image_checker.is_docker_image_accessible():
                sys.exit(1)
        except Exception:  #pylint: disable=broad-except
            LOGGER.warning("Failed to check image", exc_info=True)


if __name__ == "__main__":
    init_logger()
    main()
