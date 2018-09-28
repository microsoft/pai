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
import argparse
import os
from datetime import timedelta
from cleaner.scripts import clean_docker_cache, check_deleted_files
from cleaner.worker import Worker
from cleaner.utils.logger import LoggerMixin
from cleaner.utils import common


class Cleaner(LoggerMixin):

    def __init__(self, liveness):
        self.workers = {}
        self.liveness = liveness

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
                common.kill_process_tree(w.pid, 5, self.logger)
            except Exception as e:
                self.logger.error("errors occur when terminating worker %s.", k)
                self.logger.exception(e)

    def update_liveness(self):
        if self.liveness:
            file_name = os.path.join("/tmp", self.liveness)
            with open(file_name, "a"):
                os.utime(file_name, None)

    def sync(self):
        try:
            while True:
                stopped_workers = [(k, w) for k, w in self.workers.items() if not w.is_alive()]
                if len(stopped_workers) > 0:
                    for k, w in stopped_workers:
                        self.logger.error("worker %s exit with code %s", k, w.exitcode)
                        self.workers.pop(k)
                if len(self.workers) == 0:
                    self.logger.info("all workers are stopped and exit cleaner.")
                    break
                self.update_liveness()
                time.sleep(2)
        except Exception as e:
            self.logger.exception("cleaner interrupted and will exit.")
            self.terminate()
            time.sleep(1)


def get_worker(arg):
    if arg == "docker_cache":
        worker = Worker(clean_docker_cache.check_and_clean, 50, timeout=timedelta(minutes=10), cool_down_time=1800)
    elif arg == "deleted_files":
        worker = Worker(check_deleted_files.list_and_check_files, None, timeout=timedelta(minutes=10), cool_down_time=1800)
    else:
        raise ValueError("arguments %s is not supported.", arg)
    return worker


liveness_files = {
    "docker_cache": "docker-cache-cleaner-healthy",
    "deleted_files": "deleted-files-cleaner-healthy"
}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("option", help="the functions currently supported: [docker_cache | deleted_files]")
    args = parser.parse_args()

    common.setup_logging()

    cleaner = Cleaner(liveness_files[args.option])
    cleaner.add_worker(args.option, get_worker(args.option))
    cleaner.start()
    cleaner.sync()


if __name__ == "__main__":
    main()
