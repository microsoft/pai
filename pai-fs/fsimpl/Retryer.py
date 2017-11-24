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

import time
import functools

def doubling_backoff(start):
    if start == 0:
        start = 1
        yield start
    while True:
        start *=2
        yield start

def fixed_interval_delay(start):
    while True:
        yield start

class RetryAndCatch(object):
    def __init__(self, exceptions_to_catch, max_retries = 10, delayinsecond=5, backoff=fixed_interval_delay, logger=None):
        self.exceptions = exceptions_to_catch
        self.tries = max_retries
        self.logger = logger
        self.delay = delayinsecond
        self.backoff = backoff
        self.max_retries = max_retries
        
    def __call__(self, f):
        @functools.wraps(f)
        def retrier(*args, **kwargs):
            backoff_gen = self.backoff(self.delay)
            try:
                while self.tries > 1:
                    try:
                        return f(*args, **kwargs)
                    except self.exceptions as e:
                        message = "Exception {} caught, retrying {} more times.".format(e.message, self.tries)
                        
                        if self.logger :
                            self.logger.error(message)

                        time.sleep(self.delay)
                        self.delay = next(backoff_gen)
                        self.tries -= 1

                return f(*args, **kwargs)
            finally:
                self.tries = self.max_retries
        return retrier
