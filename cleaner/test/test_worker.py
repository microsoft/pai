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

from cleaner.worker import Worker
from cleaner.utils import common
import mock
import time
from multiprocessing import Queue
from unittest import TestCase, main


def called_by_worker(queue):
    queue.put(1)


def timeout_worker(queue):
    time.sleep(2)
    queue.put(1)


class TestWorker(TestCase):

    def setUp(self):
        common.setup_logging()

    def testWorkerRunOnce(self):
        queue = Queue()
        worker = Worker(called_by_worker, queue, long_run=False)
        worker.start()
        worker.join()
        data = queue.get(timeout=2)
        self.assertEqual(data, 1)

    def testWorkerLongRun(self):
        queue = Queue()
        worker = Worker(called_by_worker, queue, cool_down_time=0.1)
        worker.start()
        time.sleep(3)
        worker.terminate()
        worker.join()
        self.assertTrue(queue.qsize() > 1)

    def testWorkerTimeout(self):
        queue = Queue()
        worker = Worker(timeout_worker, queue, long_run=False, timeout=1)
        worker.start()
        worker.join()
        self.assertEqual(queue.qsize(), 0)


if __name__ == "__main__":
    main()
