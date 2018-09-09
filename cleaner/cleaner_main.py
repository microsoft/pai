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
from datetime import timedelta
from cleaner.scripts import clean_docker_cache
from cleaner.worker import Worker
from cleaner.utils.logger import LoggerMixin
from cleaner.utils import common


class Cleaner(LoggerMixin):

    def __init__(self):
        self.workers = {}

    def add_worker(self, key, worker):
        if key not in self.workers:
            self.workers[key] = worker
        else:
            self.logger.warn("worker with key %s already exists.", key)

    def start(self):
        for k, w in self.workers.items():
            w.start()
            self.logger.info("worker %s started.", k)

    def terminate(self):
        for k, w in self.workers.items():
            try:
                # terminate the worker and all its subprocesses
                common.kill_process_tree(w.pid, 1, self.logger)
            except Exception as e:
                self.logger.error("errors occur when terminating worker %s.", k)
                self.logger.exception(e)

    def sync(self):
        try:
            for w in self.workers.values():
                w.join()
        except:
            self.logger.error("cleaner interrupted and will exit.")
            self.terminate()
            time.sleep(1)


def main():
    common.setup_logging()

    cleaner = Cleaner()
    cache_worker = Worker(clean_docker_cache.check_and_clean, 10, timeout=timedelta(minutes=5))
    cleaner.add_worker("clean_docker_cache", cache_worker)

    cleaner.start()
    cleaner.sync()


if __name__ == "__main__":
    main()
