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

from unittest import TestCase, main
import mock
from cleaner.utils.common import setup_logging
from cleaner.scripts import clean_docker_cache


class TestCacheClean(TestCase):

    def setUp(self):
        setup_logging()

    @mock.patch("cleaner.utils.common.run_cmd")
    def testCacheSizeZero(self, mock_cmd):
        mock_cmd.return_value = []
        self.assertEqual(clean_docker_cache.get_cache_size(), 0)

        mock_cmd.return_value = ["0"]
        self.assertEqual(clean_docker_cache.get_cache_size(), 0)

        mock_cmd.return_value = ["error"]
        self.assertEqual(clean_docker_cache.get_cache_size(), 0)

if __name__ == "__main__":
    main()
