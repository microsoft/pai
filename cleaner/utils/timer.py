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

import signal
import time
from datetime import timedelta
from cleaner.utils.logger import LoggerMixin


class Timeout(Exception):
    pass


class CountdownTimer(LoggerMixin):
    """
    This class is to set a countdown with the given time. It will raise exceptions when the time is out.
    """

    def __init__(self, duration=timedelta(hours=1), name="countdown_timer"):
        self.duration_in_seconds = int(duration.total_seconds()) if duration else 0
        self.name = name
        self.enter_time = 0

    def __enter__(self):
        if self.duration_in_seconds == 0:
            return

        try:
            signal.signal(signal.SIGALRM, self.on_alarm)
            signal.alarm(self.duration_in_seconds)
            self.logger.info("setup countdown timer %s with duration %d" % (self.name, self.duration_in_seconds))
            self.enter_time = time.time()
        except ValueError as e:
            self.logger.error("Failed to setup countdown timer %s" % self.name)
            self.logger.exception(e)

    def __exit__(self, type, value, traceback):
        if self.duration_in_seconds == 0:
            return

        try:
            signal.alarm(0)
            self.logger.info("exit the countdown timer %s after %d seconds" % (self.name, time.time() - self.enter_time))
        except ValueError as e:
            self.logger.error("Failed to setup countdown time %s" % self.name)
            self.logger.exception(e)

    def on_alarm(self, signum, frame):
        self.logger.error("%s : the maximum time duration %d reached and will exit." % (self.name, self.duration_in_seconds))
        raise Timeout()
