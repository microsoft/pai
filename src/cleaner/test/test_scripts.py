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
import time
import psutil
import os
import multiprocessing
from cleaner.utils.common import setup_logging, run_cmd
from cleaner.scripts import clean_docker_cache, check_deleted_files

CALLED_CMD = "docker system prune -af"
LOGGER = multiprocessing.get_logger()


class TestCacheClean(TestCase):

    def setUp(self):
        setup_logging()

    @mock.patch("cleaner.utils.common.run_cmd", return_value=[])
    def testCacheEmpty(self, mock_cmd):
        self.assertEqual(clean_docker_cache.get_cache_size(), 0)

    @mock.patch("cleaner.utils.common.run_cmd", return_value=["0"])
    def testCacheZero(self, mock_cmd):
        self.assertEqual(clean_docker_cache.get_cache_size(), 0)

    @mock.patch("cleaner.utils.common.run_cmd", return_value=["error"])
    def testCacheError(self, mock_cmd):
        self.assertEqual(clean_docker_cache.get_cache_size(), 0)

    @mock.patch("cleaner.scripts.clean_docker_cache.get_cache_size", return_value=1)
    @mock.patch("cleaner.utils.common.run_cmd", return_value=["0"])
    def testCleanTrue(self, mock_cmd, mock_size):
        clean_docker_cache.check_and_clean(0)
        mock_cmd.assert_called_once_with(CALLED_CMD, LOGGER)

    @mock.patch("cleaner.scripts.clean_docker_cache.get_cache_size", return_value=0)
    @mock.patch("cleaner.utils.common.run_cmd", return_value=["0"])
    def testCleanFalse(self, mock_cmd, mock_size):
        clean_docker_cache.check_and_clean(0)
        mock_cmd.assert_not_called()


class TestDeletedFiles(TestCase):

    def testDeletedCmd(self):
        test_file = "/tmp/deleted_test.txt"

        def open_and_loop():
            with open(test_file, "w"):
                while True:
                    pass

        proc = multiprocessing.Process(target=open_and_loop)
        proc.start()
        time.sleep(1)
        os.remove("/tmp/deleted_test.txt")
        time.sleep(1)

        mock_logger = mock.Mock()
        cmd_out = run_cmd(check_deleted_files.DELETED_FILES_CMD, mock_logger)
        files = [f.split(" ")[1] for f in cmd_out[1:]]
        self.assertTrue(test_file in files)

        proc.terminate()
        proc.join()

    @mock.patch("cleaner.utils.common.run_cmd", return_value=["PID NAME"])
    def testDeletedCheckEmpty(self, mock_cmd):
        mock_log = mock.Mock()
        check_deleted_files.list_and_check_files(None, mock_log)
        mock_log.info.assert_called_once()

    @mock.patch("cleaner.utils.common.run_cmd", return_value=["PID NAME", "1, /test"])
    def testDeletedCheckNonEmpty(self, mock_cmd):
        mock_log = mock.Mock()
        check_deleted_files.list_and_check_files(None, mock_log)
        mock_log.info.assert_not_called()
        mock_log.warning.assert_called_once()


if __name__ == "__main__":
    main()
