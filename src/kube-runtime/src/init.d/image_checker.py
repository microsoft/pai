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
import re
import sys

import requests
import yaml

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import common.utils as utils  #pylint: disable=wrong-import-position

LOGGER = logging.getLogger(__name__)

# The workflow, refer to: https://docs.docker.com/registry/spec/auth/token/
# 1. send registry v2 request, if registry doesn't support v2 api, ignore image check
# 2. try to call v2 api to get image manifest. If return 401, do following steps
# 3. use WWW-Authenticate header returned from previous request to generate auth info
# 4. use generated auth info to get token
# 5. try to get image manifest with returned token. If succeed, the image is found in registry

BEARER_AUTH = "Bearer"
BASIC_AUTH = "Basic"
DEAULT_REGISTRY = "https://index.docker.io/v2/"


class ImageChecker():
    @staticmethod
    def _get_registry_uri(uri) -> str:
        ret_uri = uri.strip().rstrip("/")
        if not ret_uri.startswith("http") and not ret_uri.startswith("https"):
            ret_uri = "https://{}".format(ret_uri)
        chunks = ret_uri.split('/')
        api_version_str = chunks[-1]
        if api_version_str == "v1" or api_version_str == "v2":
            ret_uri = "/".join(chunks[:-1])
        ret_uri = ret_uri.rstrip("/") + "/v2/"
        return ret_uri

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

        self._image_uri = image_info["uri"]
        self._registry_uri = DEAULT_REGISTRY
        self._basic_auth_headers = {}
        self._bearer_auth_headers = {}
        self._registry_auth_type = BASIC_AUTH

        if "auth" in image_info and secret:
            auth = image_info["auth"]
            self._init_auth_info(auth, secret)

    def _init_auth_info(self, auth, secret) -> None:
        if "registryuri" in auth:
            registry_uri = self._get_registry_uri(auth["registryuri"])
            if self._is_image_use_default_domain(
            ) and registry_uri != DEAULT_REGISTRY:
                LOGGER.info(
                    "Using default registry for image %s, ignore auth info",
                    self._image_uri)
                return
            self._registry_uri = registry_uri

        username = auth["username"] if "username" in auth else ""
        password = utils.render_string_with_secrets(
            auth["password"], secret) if "password" in auth else ""
        if username and password:
            basic_auth_token = base64.b64encode(
                bytes("{}:{}".format(username, password), "utf8")).decode()
            self._basic_auth_headers["Authorization"] = "{} {}".format(
                BASIC_AUTH, basic_auth_token)

    # Refer: https://github.com/docker/distribution/blob/a8371794149d1d95f1e846744b05c87f2f825e5a/reference/normalize.go#L91
    def _is_image_use_default_domain(self) -> bool:
        index = self._image_uri.find("/")
        return index == -1 or all(ch not in [".", ":"]
                                  for ch in self._image_uri[:index])

    # Parse the challenge field, refer to: https://tools.ietf.org/html/rfc6750#section-3
    def _parse_auth_challenge(self, challenge) -> dict:
        if not challenge.strip().startswith(BEARER_AUTH):
            LOGGER.info("Challenge not supported, ignore this")
            return {}

        chunks = challenge.strip()[len(BEARER_AUTH):].split(",")
        challenge_dir = {}
        for chunk in chunks:
            pair = chunk.strip().split("=")
            challenge_dir[pair[0]] = pair[1].strip("\"")
        return challenge_dir

    def _get_and_set_token(self, challenge) -> None:
        if not challenge:
            return
        if "realm" not in challenge:
            LOGGER.warning("realm not in challenge, use basic auth")
            return
        url = challenge["realm"]
        paramters = copy.deepcopy(challenge)
        del paramters["realm"]
        resp = requests.get(url,
                            headers=self._basic_auth_headers,
                            params=paramters)
        if not resp.ok:
            raise RuntimeError(
                "Failed to get auth token, status code: {}".format(
                    resp.status_code))
        body = resp.json()
        self._bearer_auth_headers["Authorization"] = "{} {}".format(
            BEARER_AUTH, body["token"])
        self._registry_auth_type = BEARER_AUTH

    def _is_registry_v2_supportted(self) -> bool:
        try:
            resp = requests.head(self._registry_uri,
                                 headers=self._basic_auth_headers,
                                 timeout=10)
            if resp.ok or resp.status_code == http.HTTPStatus.UNAUTHORIZED:
                return True
            return False
        except (TimeoutError, ConnectionError):
            return False

    def _login_v2_registry(self, attempt_url) -> None:
        if not self._is_registry_v2_supportted():
            LOGGER.warning(
                "Registry %s not support v2 api, ignore image check",
                self._registry_uri)
            return
        resp = requests.head(attempt_url, headers=self._basic_auth_headers)
        if not resp.ok and resp.status_code != http.HTTPStatus.UNAUTHORIZED:
            LOGGER.error("Failed to login registry, resp code is %d",
                         resp.status_code)
            raise RuntimeError("Failed to login registry")
        headers = resp.headers
        if "Www-Authenticate" in headers:
            challenge = self._parse_auth_challenge(headers["Www-Authenticate"])
            self._get_and_set_token(challenge)

    def _get_normalized_image_info(self) -> dict:
        uri = self._image_uri
        if not self._is_image_use_default_domain():
            assert "/" in self._image_uri
            index = self._image_uri.find("/")
            uri = self._image_uri[index + 1:]

        uri_chunks = uri.split(":")
        tag = "latest" if len(uri_chunks) == 1 else uri_chunks[1]
        repository = uri_chunks[0]
        if not re.fullmatch(r"(?:[a-z\-_.0-9]+\/)?[a-z\-_.0-9]+",
                            repository) or not re.fullmatch(
                                r"[a-z\-_.0-9]+", tag):
            raise RuntimeError("image uri {} is invalid".format(
                self._image_uri))

        repo_chunks = uri_chunks[0].split("/")
        if len(repo_chunks) == 1:
            return {"repo": "library/{}".format(repository), "tag": tag}
        return {"repo": repository, "tag": tag}

    @utils.enable_request_debug_log
    def is_docker_image_accessible(self):
        try:
            image_info = self._get_normalized_image_info()
        except RuntimeError:
            LOGGER.error("docker image uri: %s is invalid",
                         self._image_uri,
                         exc_info=True)
            return False

        url = "{}{repo}/manifests/{tag}".format(self._registry_uri,
                                                **image_info)
        try:
            self._login_v2_registry(url)
        except RuntimeError:
            LOGGER.error("login failed, username or password incorrect",
                         exc_info=True)
            return False

        if self._registry_auth_type == BEARER_AUTH:
            resp = requests.head(url, headers=self._bearer_auth_headers)
        else:
            resp = requests.head(url, headers=self._basic_auth_headers)
        if resp.ok:
            LOGGER.info("image %s found in registry", self._image_uri)
            return True
        if resp.status_code == http.HTTPStatus.NOT_FOUND or resp.status_code == http.HTTPStatus.UNAUTHORIZED:
            LOGGER.info(
                "image %s not found or user unauthorized, registry is %s, resp code is %d",
                self._image_uri, self._registry_uri, resp.status_code)
            return False
        LOGGER.warning("resp with code %d, ignore image check",
                       resp.status_code)
        raise RuntimeError("Unknown response from registry")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("job_config", help="job config yaml")
    parser.add_argument("secret_file", help="secret file path")
    args = parser.parse_args()

    LOGGER.info("get job config from %s", args.job_config)
    with open(args.job_config) as config:
        job_config = yaml.safe_load(config)

    if not os.path.isfile(args.secret_file):
        job_secret = None
    else:
        with open(args.secret_file) as f:
            job_secret = yaml.safe_load(f.read())

    LOGGER.info("Start checking docker image")
    image_checker = ImageChecker(job_config, job_secret)
    try:
        if not image_checker.is_docker_image_accessible():
            sys.exit(1)
    except Exception:  #pylint: disable=broad-except
        LOGGER.warning("Failed to check image", exc_info=True)


if __name__ == "__main__":
    utils.init_logger()
    main()
