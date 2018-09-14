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
from cleaner.utils.common import setup_logging
from cleaner.scripts import clean_docker_cache, check_deleted_files

CALLED_CMD = "docker system prune -af"
LOGGER = multiprocessing.get_logger()


def empty_out(cmd, logger):
    return []


def zero_out(cmd, logger):
    return ["0"]


def error_out(cmd, logger):
    return ["error"]


def zero_size():
    return 0


def one_size():
    return 1


class TestCacheClean(TestCase):

    def setUp(self):
        setup_logging()

    @mock.patch("cleaner.utils.common.run_cmd", side_effect=empty_out)
    def testCacheEmpty(self, mock_cmd):
        self.assertEqual(clean_docker_cache.get_cache_size(), 0)

    @mock.patch("cleaner.utils.common.run_cmd", side_effect=zero_out)
    def testCacheZero(self, mock_cmd):
        self.assertEqual(clean_docker_cache.get_cache_size(), 0)

    @mock.patch("cleaner.utils.common.run_cmd", side_effect=error_out)
    def testCacheError(self, mock_cmd):
        self.assertEqual(clean_docker_cache.get_cache_size(), 0)

    @mock.patch("cleaner.scripts.clean_docker_cache.get_cache_size", side_effect=one_size)
    @mock.patch("cleaner.utils.common.run_cmd", side_effect=zero_out)
    def testCleanTrue(self, mock_cmd, mock_size):
        clean_docker_cache.check_and_clean(0)
        mock_cmd.assert_called_once_with(CALLED_CMD, LOGGER)

    @mock.patch("cleaner.scripts.clean_docker_cache.get_cache_size", side_effect=zero_size)
    @mock.patch("cleaner.utils.common.run_cmd", side_effect=zero_out)
    def testCleanFalse(self, mock_cmd, mock_size):
        clean_docker_cache.check_and_clean(0)
        mock_cmd.assert_not_called()


class TestFileDelete(TestCase):

    proc = None

    @classmethod
    def setUpClass(cls):
        setup_logging()

        def proc_target():
            while True:
                time.sleep(1)

        cls.proc = multiprocessing.Process(target=proc_target)
        cls.proc.start()

    @classmethod
    def tearDownClass(cls):
        cls.proc.terminate()

    @mock.patch("os.path.exists")
    def testFileEmpty(self, mock_os):
        ps_proc = psutil.Process(self.proc.pid)

        file = mock.Mock()
        file.path = ""
        ps_proc.open_files = mock.Mock(return_value=[file])

        check_deleted_files.check_deleted_files(ps_proc)
        mock_os.assert_not_called()
        self.assertFalse(bool(file.path) and not mock_os(file.path))

    @mock.patch("os.path.exists", return_value=False)
    def testFileDeleted(self, mock_os):
        ps_proc = psutil.Process(self.proc.pid)

        file = mock.Mock()
        file.path = "/file_should_not_exist"
        ps_proc.open_files = mock.Mock(return_value=[file])

        check_deleted_files.check_deleted_files(ps_proc)
        mock_os.assert_called_with(file.path)
        self.assertTrue(bool(file.path) and not mock_os(file.path))

    @mock.patch("os.path.exists", return_value=True)
    def testFileExist(self, mock_os):
        ps_proc = psutil.Process(self.proc.pid)

        file = mock.Mock()
        file.path = "/tmp/test_exist_file"
        ps_proc.open_files = mock.Mock(return_value=[file])

        check_deleted_files.check_deleted_files(ps_proc)
        mock_os.assert_called_with(file.path)
        self.assertFalse(bool(file.path) and not mock_os(file.path))

    @mock.patch("os.path.exists")
    def testFileException(self, mock_os):
        ps_proc = psutil.Process(self.proc.pid)
        ps_proc.open_files = mock.Mock(side_effect=psutil.Error())
        check_deleted_files.check_deleted_files(ps_proc)
        mock_os.assert_not_called()


if __name__ == "__main__":
    main()
