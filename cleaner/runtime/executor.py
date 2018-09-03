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


import subprocess
import time
import multiprocessing
from threading import Thread, Lock
from cleaner.utils.logger import LoggerMixin


class RunningResult(object):
    SUCCESS = "success"
    FAILED = "failed"


class Worker(LoggerMixin, multiprocessing.Process):
    def __init__(self, key, command, out_queue):
        super(Worker, self).__init__()
        self.daemon = True
        self.out_queue = out_queue
        self.key = key
        self.command = command

    def _do(self):
        if self.key is None or self.command is None:
            return

        self.logger.info("worker %s starts to run command %s", self.__class__.__name__, self.command)
        bash_command = "exec bash -c '{0}'".format(self.command)
        try:
            subprocess.check_call(bash_command, shell=True, close_fds=True)
            self.out_queue.put((self.key, RunningResult.SUCCESS))
        except subprocess.CalledProcessError as e:
            self.out_queue.put((self.key, RunningResult.FAILED))
            self.logger.error("worker %s fails to run command %s, error is %s", self.__class__.__name__, self.command, str(e))

    def run(self):
        self._do()


class Executor(LoggerMixin):

    def __init__(self):
        self.out_queue = multiprocessing.Queue()
        self.active_workers = {}
        self.lock = Lock()
        self.main = None
        self.stop = False

    def run_async(self, key, command):
        if self.main is None:
            self.logger.error("executor is not started yet.")
            return

        with self.lock:
            if key in self.active_workers:
                self.logger.info("command with key %s is running and will not start it anymore.", key)
                return

            worker = Worker(key, command, self.out_queue)
            self.active_workers[key] = worker
        worker.start()

    def _on_worker_complete(self, key, state):
        self.logger.info("command with key %s finished with state %s", key, state)
        with self.lock:
            self.active_workers.pop(key)

    def start(self):
        """
        star the main thread of executor.
        :return:
        """
        def executor_main():
            while not self.stop:
                result = self.out_queue.get()
                self._on_worker_complete(*result)
                time.sleep(1)

        self.main = Thread(target=executor_main)
        self.main.daemon = True
        self.main.start()

    def end(self):
        """
        end the executor and all its workers synchronously.
        :return:
        """
        while True:
            with self.lock:
                workers = len(self.active_workers)
            if workers == 0:
                break
            time.sleep(2)
        self.stop = True
