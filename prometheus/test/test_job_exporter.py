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
import unittest
import yaml
import threading
import logging
import logging.config
from exporter import job_exporter

log = logging.getLogger(__name__)

class TestJobExporter(unittest.TestCase):
    """
    Test job_exporter.py
    """
    def setUp(self):
        try:
            os.chdir(os.path.abspath("test"))
        except:
            pass

        configuration_path = "test_logging.yaml"

        if os.path.exists(configuration_path):
            with open(configuration_path, 'rt') as f:
                logging_configuration = yaml.safe_load(f.read())
            logging.config.dictConfig(logging_configuration)
            logging.getLogger()


    def tearDown(self):
        try:
            os.chdir(os.path.abspath(".."))
        except:
            pass

    def test_singleton_normal(self):
        def getter():
            return 100

        singleton = job_exporter.Singleton(getter)

        for _ in xrange(10):
            self.assertEqual(100, singleton.try_get())

    def test_singleton_with_blocking_getter_no_old_data(self):
        semaphore = threading.Semaphore(1)

        def blocking_getter():
            semaphore.acquire(blocking=True)
            semaphore.release()
            return 100

        singleton = job_exporter.Singleton(blocking_getter, get_timeout_s=0.2, old_data_timeout_s=0)

        for _ in xrange(3):
            semaphore.acquire()

            for _ in xrange(3):
                self.assertIsNone(singleton.try_get())

            semaphore.release()
            self.assertEqual(100, singleton.try_get())

    def test_singleton_with_blocking_getter_allow_old_data(self):
        semaphore = threading.Semaphore(1)

        def blocking_getter():
            semaphore.acquire(blocking=True)
            semaphore.release()
            return 100

        singleton = job_exporter.Singleton(blocking_getter, get_timeout_s=0.2, old_data_timeout_s=30)

        semaphore.acquire()

        for _ in xrange(3):
            self.assertIsNone(singleton.try_get())

        semaphore.release()
        # let singleton cache one value
        self.assertEqual(100, singleton.try_get())

        for _ in xrange(3):
            semaphore.acquire()

            for _ in xrange(3):
                # singleton returns old value
                self.assertEqual(100, singleton.try_get())

            semaphore.release()
            self.assertEqual(100, singleton.try_get())

if __name__ == '__main__':
    unittest.main()
