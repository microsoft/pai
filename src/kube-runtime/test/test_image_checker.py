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

import os
import functools
from functools import partial
import http
import sys
import unittest
from unittest.mock import patch

import responses
import yaml

# pylint: disable=wrong-import-position
sys.path.append(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "../src"))
sys.path.append(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "../src/init.d"))
from image_checker import ImageChecker
from common.utils import init_logger
# pylint: enable=wrong-import-position

PACKAGE_DIRECTORY_COM = os.path.dirname(os.path.abspath(__file__))
init_logger()


# pylint: disable=protected-access
def prepare_image_check(job_config_path):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(self, *args, **kwargs):
            os.environ["PAI_CURRENT_TASK_ROLE_NAME"] = "worker"
            if os.path.exists(job_config_path):
                with open(job_config_path, 'r') as f:
                    configs = list(yaml.safe_load_all(f))
                    if len(configs) == 1:
                        self.job_config = configs[0]
                    if len(configs) == 2:
                        self.job_config = configs[0]
                        self.secret = configs[1]
                self.image_checker = ImageChecker(self.job_config, self.secret)
                self.image_info = self.image_checker._get_normalized_image_info(
                )
                func(self, *args, **kwargs)
            del os.environ["PAI_CURRENT_TASK_ROLE_NAME"]

        return wrapper

    return decorator


def add_official_registry_v2_response(image_info, options=None):
    responses.add(
        responses.HEAD,
        "https://index.docker.io/v2/",
        status=http.HTTPStatus.UNAUTHORIZED,
        headers={
            "Www-Authenticate":
            "Bearer realm=\"https://auth.docker.io/token\",service=\"registry.docker.io\",error=\"invalid_token\""
        })
    responses.add_callback(
        responses.HEAD,
        "https://index.docker.io/v2/{repo}/manifests/{tag}".format(
            **image_info),
        callback=partial(official_registry_request_callback,
                         repo=image_info["repo"],
                         options=options))
    responses.add(
        responses.GET,
        "https://auth.docker.io/token?service=registry.docker.io&scope=repository:{repo}:pull"
        .format(**image_info),
        status=http.HTTPStatus.OK,
        json={"token": "BearerToken"})


def add_azure_registry_v2_response(image_info):
    responses.add(responses.HEAD,
                  "https://openpai.azurecr.io/v2/",
                  status=http.HTTPStatus.OK)
    responses.add(
        responses.HEAD,
        "https://openpai.azurecr.io/v2/{repo}/manifests/{tag}".format(
            **image_info),
        status=http.HTTPStatus.OK)


def official_registry_request_callback(request, repo, options):
    headers = request.headers
    if "Authorization" in headers and headers["Authorization"].startswith(
            "Bearer"):
        if options and "image_not_found" in options and options[
                "image_not_found"]:
            return (http.HTTPStatus.NOT_FOUND, {}, None)
        return (http.HTTPStatus.OK, {}, None)
    scope = "repository:{}:pull".format(repo)
    headers = {
        "Www-Authenticate":
        ("Bearer realm=\"https://auth.docker.io/token\","
         "service=\"registry.docker.io\",scope=\"{}\"".format(scope))
    }
    return (http.HTTPStatus.UNAUTHORIZED, headers, None)


class TestImageChecker(unittest.TestCase):
    def setUp(self):
        try:
            os.chdir(PACKAGE_DIRECTORY_COM)
        except Exception:  #pylint: disable=broad-except
            pass
        self.job_config = {}
        self.secret = {}
        self.image_checker = None
        self.image_info = None

    @prepare_image_check("docker_official_image.yaml")
    @responses.activate
    def test_official_image(self):
        add_official_registry_v2_response(self.image_info)
        self.assertTrue(self.image_checker.is_docker_image_accessible())

    @prepare_image_check("docker_image_no_exist.yaml")
    @responses.activate
    def test_image_not_exist(self):
        add_official_registry_v2_response(self.image_info,
                                          options={"image_not_found": True})
        self.assertFalse(self.image_checker.is_docker_image_accessible())

    @prepare_image_check("docker_image_acr_registry.yaml")
    @responses.activate
    def test_acr_image(self):
        add_azure_registry_v2_response(self.image_info)
        self.assertTrue(self.image_checker.is_docker_image_accessible())

    @prepare_image_check("docker_image_auth.yaml")
    @responses.activate
    def test_image_with_auth(self):
        add_official_registry_v2_response(self.image_info)
        self.assertTrue(self.image_checker.is_docker_image_accessible())

    @patch.object(ImageChecker, "__init__")
    def test_is_use_default_domain(self, mock):
        mock.return_value = None
        mock_image_checker = ImageChecker({}, {})

        test_cases = [{
            "image_uri": "registry.domain/user-name/repo-0:tag-0.version",
            "expect_image_info": {
                "repo": "user-name/repo-0",
                "tag": "tag-0.version"
            }
        }, {
            "image_uri": "username/repo:tag",
            "expect_image_info": {
                "repo": "username/repo",
                "tag": "tag"
            }
        }, {
            "image_uri": "username/repo",
            "expect_image_info": {
                "repo": "username/repo",
                "tag": "latest"
            }
        }, {
            "image_uri": "ubuntu",
            "expect_image_info": {
                "repo": "library/ubuntu",
                "tag": "latest"
            }
        }, {
            "image_uri": "golang:1.12.6-alpine",
            "expect_image_info": {
                "repo": "library/golang",
                "tag": "1.12.6-alpine"
            }
        }, {
            "image_uri": "pytorch/pytorch:1.3-cuda10.1-cudnn7-runtime",
            "expect_image_info": {
                "repo": "pytorch/pytorch",
                "tag": "1.3-cuda10.1-cudnn7-runtime"
            }
        }]

        for test_case in test_cases:
            mock_image_checker._image_uri = test_case["image_uri"]
            image_info = ImageChecker._get_normalized_image_info(
                mock_image_checker)
            self.assertDictEqual(image_info, test_case["expect_image_info"])

        invalid_docker_hub_uris = [
            "localhost:5000/~repo", "localhost/user@name/repo:tag"
        ]

        for uri in invalid_docker_hub_uris:
            mock_image_checker._image_uri = uri
            self.assertRaises(RuntimeError,
                              mock_image_checker._get_normalized_image_info)


if __name__ == '__main__':
    unittest.main()
