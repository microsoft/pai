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
import sys
import unittest

import yaml

sys.path.append("{}/../src/init.d".format(
    os.path.split(os.path.realpath(__file__))[0]))
import image_checker

package_directory_com = os.path.dirname(os.path.abspath(__file__))


class TestImageChecker(unittest.TestCase):
    def setUp(self):
        try:
            os.chdir(package_directory_com)
        except:
            pass

    def test_image_without_username_tag(self):
        os.environ["FC_TASK_INDEX"] = "0"
        job_path = "docker_image_no_user_tag.yaml"
        if os.path.exists(job_path):
            with open(job_path, 'r') as f:
                jobconfig = yaml.load(f)
        res = image_checker._is_docker_image_valid(jobconfig)
        self.assertEqual(res, True)
        del os.environ["FC_TASK_INDEX"]

    def test_image_without_tag(self):
        os.environ["FC_TASK_INDEX"] = "0"
        job_path = "docker_image_no_tag.yaml"
        if os.path.exists(job_path):
            with open(job_path, 'r') as f:
                jobconfig = yaml.load(f)
        res = image_checker._is_docker_image_valid(jobconfig)
        self.assertEqual(res, True)
        del os.environ["FC_TASK_INDEX"]

    def test_image_not_exist(self):
        os.environ["FC_TASK_INDEX"] = "0"
        job_path = "docker_image_no_exist.yaml"
        if os.path.exists(job_path):
            with open(job_path, 'r') as f:
                jobconfig = yaml.load(f)
        res = image_checker._is_docker_image_valid(jobconfig)
        self.assertEqual(res, False)
        del os.environ["FC_TASK_INDEX"]

    def test_docker_hub_uri(self):
        uri = "localhost/username/repo:tag"
        self.assertFalse(image_checker._is_docker_hub_uri(uri))

        uri = "username/repo:tag"
        self.assertTrue(image_checker._is_docker_hub_uri(uri))

        uri = "username/repo"
        self.assertTrue(image_checker._is_docker_hub_uri(uri))

        uri = "repo"
        self.assertTrue(image_checker._is_docker_hub_uri(uri))

        uri = "localhost:5000/repo"
        self.assertFalse(image_checker._is_docker_hub_uri(uri))

        uri = "user-name.domain/repo-0.domain:tag-0.domain"
        self.assertTrue(image_checker._is_docker_hub_uri(uri))


if __name__ == '__main__':
    unittest.main()