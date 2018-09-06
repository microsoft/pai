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

from cleaner.utils.logger import LoggerMixin
from cleaner.utils.timer import CountdownTimer, Timeout
from cleaner.utils.common import run_cmd, setup_logging
from datetime import timedelta
from unittest import TestCase, main
import time


class UtilsTest(TestCase, LoggerMixin):

    def setUp(self):
        setup_logging()

    def test_logger(self):
        self.assertTrue(self.logger is not None, "logger cannot be None.")

    def test_timer_exception(self):
        count = 0
        with self.assertRaises(Timeout):
            with CountdownTimer(duration=timedelta(seconds=1)):
                while count < 3:
                    time.sleep(1)
                    count += 1

    def test_timer_no_exception(self):
        no_timeout = True
        try:
            with CountdownTimer(duration=timedelta(seconds=3)):
                time.sleep(1)
        except Timeout:
            no_timeout = False
        self.assertTrue(no_timeout)

    def test_no_timer(self):
        no_timer = True
        try:
            with CountdownTimer(duration=None):
                time.sleep(1)
        except Timeout:
            no_timer = False
        self.assertTrue(no_timer)

    def testRunCmdOneLine(self):
        out = run_cmd("echo test", self.logger)
        self.assertEqual(out[0], "test")

    def testRunCmdEmptyOut(self):
        out = run_cmd("echo test > /dev/null", self.logger)
        self.assertEqual(len(out), 0)


if __name__ == "__main__":
    main()
