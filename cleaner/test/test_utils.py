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
from cleaner.utils.common import *
from datetime import timedelta
from unittest import TestCase, main
import time
import mock
import subprocess as sp
import signal
import os
import psutil


def ps_raise(procs, timeout, callback):
    raise psutil.Error


def kill_process_list_mock(procs, sig, timeout, logger):
    for p in procs:
        kill_process(p, sig, logger)
    time.sleep(timeout)
    return procs


class UtilsTest(TestCase, LoggerMixin):

    def setUp(self):
        setup_logging()

    def testLogger(self):
        self.assertTrue(self.logger is not None, "logger cannot be None.")

    def testTimerException(self):
        count = 0
        with self.assertRaises(Timeout):
            with CountdownTimer(duration=timedelta(seconds=1)):
                while count < 3:
                    time.sleep(1)
                    count += 1

    def testTimerExceptionSleep(self):
        with self.assertRaises(Timeout):
            with CountdownTimer(duration=timedelta(seconds=1)):
                time.sleep(10)

    def testTimerNoException(self):
        no_timeout = True
        try:
            with CountdownTimer(duration=timedelta(seconds=3)):
                time.sleep(1)
        except Timeout:
            no_timeout = False
        self.assertTrue(no_timeout)

    def testNoTimer(self):
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

    def testTerminateProcess(self):
        proc = sp.Popen(["/bin/bash", "-c", "sleep 3600"])
        kill_process(proc, signal.SIGTERM, self.logger)
        time.sleep(1)
        self.assertEqual(proc.poll(), -signal.SIGTERM)

    def testKillProcess(self):
        proc = sp.Popen(["/bin/bash", "-c", "sleep 3600"])
        kill_process(proc, signal.SIGKILL, self.logger)
        time.sleep(1)
        self.assertEqual(proc.poll(), -signal.SIGKILL)

    def testKillProcessList(self):
        procs = []
        procs.append(sp.Popen(["/bin/bash", "-c", "sleep 3600"]))
        procs.append(sp.Popen(["/bin/bash", "-c", "sleep 3600"]))

        ps_procs = [psutil.Process(p.pid) for p in procs]
        alive = kill_process_list(ps_procs, signal.SIGTERM, 1, self.logger)
        self.assertEqual(len(alive), 0)
        self.assertTrue(procs[0].poll() is not None)
        self.assertTrue(procs[1].poll() is not None)

    @mock.patch("psutil.wait_procs", side_effect=ps_raise)
    def testKillProcessListError(self, mock_wait):
        proc = sp.Popen(["/bin/bash", "-c", "sleep 1200"])
        ps_procs = [psutil.Process(proc.pid)]
        alive = kill_process_list(ps_procs, signal.SIGTERM, 1, self.logger)
        mock_wait.assert_called_once()
        self.assertEqual(ps_procs, alive)
        self.assertTrue(proc.poll() is not None)

    def testKillProcessTree(self):
        test_shell = "#!/bin/bash \n" \
                     "# create a background process as child \n" \
                     "sleep 1000 & \n" \
                     "# wait to block the foreground process \n" \
                     "sleep 1000 \n"
        with open("/tmp/subprocess.sh", "w") as sh:
            sh.write(test_shell)
        proc = sp.Popen(["/bin/bash", "/tmp/subprocess.sh"])
        time.sleep(1)
        subproc = psutil.Process(proc.pid).children(recursive=True)
        self.assertTrue(len(subproc) == 2)

        kill_process_tree(proc.pid, 1, self.logger)
        gone, alive = psutil.wait_procs(subproc, timeout=1)
        self.assertTrue(len(alive) == 0)
        self.assertTrue(proc.poll() is not None)

    @mock.patch("cleaner.utils.common.kill_process_list", side_effect=kill_process_list_mock)
    def testKillProcessTreeError(self, mock_kill):
        proc = sp.Popen(["/bin/bash", "-c", "sleep 1200"])
        kill_process_tree(proc.pid, 1, self.logger)
        self.assertTrue(mock_kill.call_count == 2)
        self.assertTrue(proc.poll() is not None)


if __name__ == "__main__":
    main()
