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
import multiprocessing
import time
from datetime import timedelta


class Worker(LoggerMixin, multiprocessing.Process):

    def __init__(self, method, arg, timeout=timedelta(hours=1), long_run=True, cool_down_time=2):
        super(Worker, self).__init__()
        self.method = method
        self.timeout = timeout
        self.long_run = long_run
        self.cool_down_time = cool_down_time
        self.arg = arg

    def _exec(self):
        exc = None
        method_name = self.method.__name__
        try:
            self.logger.info("start to execute method %s.", method_name)
            with CountdownTimer(duration=self.timeout):
                self.method(self.arg)
        except Timeout as e:
            self.logger.error("command %s timeout.", method_name)
            exc = e
        except Exception as e:
            self.logger.error("unexpected error to run method %s.", method_name)
            exc = e

        if exc is not None:
            self.logger.exception(exc)

    def run(self):
        if self.method is None:
            self.logger.error("cannot start worker with empty method.")
            return

        if self.long_run and self.cool_down_time <= 0:
            self.cool_down_time = 1
            self.logger.warn("input cool down time should be positive, will use value %d.", self.cool_down_time)

        if self.long_run:
            while True:
                # allow a delay before the cleaning
                time.sleep(self.cool_down_time)
                self._exec()
        else:
            self._exec()
