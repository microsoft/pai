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
import sys
import unittest

import yaml

sys.path.append("{}/../src/init.d".format(
    os.path.split(os.path.realpath(__file__))[0]))
import image_checker

package_directory_com = os.path.dirname(os.path.abspath(__file__))


def prepare_image_check(job_config_path):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(self, *args, **kwargs):
            os.environ["FC_TASKROLE_NAME"] = "worker"
            if os.path.exists(job_config_path):
                with open(job_config_path, 'r') as f:
                    self.config = yaml.load(f, Loader=yaml.FullLoader)
                func(self, *args, **kwargs)
            del os.environ["FC_TASKROLE_NAME"]

        return wrapper

    return decorator


class TestImageChecker(unittest.TestCase):
    def setUp(self):
        try:
            os.chdir(package_directory_com)
        except:
            pass
        self.config = {}

    @prepare_image_check("docker_image_no_user_tag.yaml")
    def test_image_without_username_tag(self):
        res = image_checker._is_docker_image_valid(self.config)
        self.assertEqual(res, True)

    @prepare_image_check("docker_image_no_tag.yaml")
    def test_image_without_tag(self):
        res = image_checker._is_docker_image_valid(self.config)
        self.assertEqual(res, True)

    @prepare_image_check("docker_image_no_exist.yaml")
    def test_image_not_exist(self):
        res = image_checker._is_docker_image_valid(self.config)
        self.assertEqual(res, False)

    @prepare_image_check("docker_image_local_registry.yaml")
    def test_image_local(self):
        res = image_checker._is_docker_image_valid(self.config)
        self.assertEqual(res, True)

    @prepare_image_check("docker_image_auth.yaml")
    def test_image_auth(self):
        res = image_checker._is_docker_image_valid(self.config)
        self.assertEqual(res, True)

    def test_docker_hub_uri(self):
        valid_docker_hub_uris = [
            "user-name.domain/repo-0.domain:tag-0.domain", "username/repo:tag",
            "username/repo", "repo"
        ]

        for uri in valid_docker_hub_uris:
            self.assertTrue(image_checker._is_docker_hub_uri(uri))

        invalid_docker_hub_uris = [
            "localhost:5000/repo", "localhost/username/repo:tag"
        ]

        for uri in invalid_docker_hub_uris:
            self.assertFalse(image_checker._is_docker_hub_uri(uri))


if __name__ == '__main__':
    unittest.main()