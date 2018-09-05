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
import sys
import multiprocessing
from threading import Thread, Lock
from cleaner.utils.logger import LoggerMixin
from cleaner.utils.timer import CountdownTimer, Timeout


class RunningResult(object):
    SUCCESS = "success"
    FAILED = "failed"
    TIMEOUT = "timeout"
    FALSE_CONDITION = "false_condition"
    UNEXPECTED_ERROR = "unexpected_error"


class Worker(LoggerMixin, multiprocessing.Process):
    def __init__(self, key, rule, out_queue):
        super(Worker, self).__init__()
        self.out_queue = out_queue
        self.key = key
        self.rule = rule

    def _do(self):
        if self.key is None or self.rule is None:
            return

        self.logger.info("worker %s starts to run rule %s", self.__class__.__name__, self.key)
        bash_command = self.rule.action.command
        bash_command = "exec bash -c '{0}'".format(bash_command)
        self.logger.info("will execute command %s", bash_command)

        try:
            condition_input = self.rule.condition.input_data
            condition_method = self.rule.condition.method
            if condition_method(condition_input):
                self.logger.info("condition %s is true, will run action %s.", self.rule.condition.key,
                                 self.rule.action.key)
                with CountdownTimer(self.rule.action_timeout):
                    subprocess.check_call(bash_command, shell=True, close_fds=True)
                    self.out_queue.put((self.key, RunningResult.SUCCESS))
            else:
                self.out_queue.put((self.key, RunningResult.FALSE_CONDITION))
        except subprocess.CalledProcessError as e:
            self.out_queue.put((self.key, RunningResult.FAILED))
            self.logger.error("worker %s fails to run rule %s, error is %s", self.__class__.__name__, self.key, str(e))
        except Timeout:
            self.out_queue.put((self.key, RunningResult.TIMEOUT))
            self.logger.error("worker timeout when running rule %s", self.key)
        except:
            self.out_queue.put((self.key, RunningResult.UNEXPECTED_ERROR))
            self.logger.error("rule %s failed with unexpected error %s", self.key, str(sys.exc_info()))

    def run(self):
        self._do()


class Executor(LoggerMixin):

    def __init__(self, complete_callback=None):
        self.out_queue = multiprocessing.Queue()
        self.active_workers = {}
        self.lock = Lock()
        self.main = None
        self.on_complete = complete_callback

    def run_async(self, key, rule):
        if self.main is None:
            self.logger.error("executor is not started yet.")
            return self

        with self.lock:
            if key in self.active_workers:
                self.logger.info("worker %s is running", key)
                return self

            worker = Worker(key, rule, self.out_queue)
            self.active_workers[key] = worker
        worker.start()
        self.logger.info("worker %s is started.", key)
        return self

    def _on_worker_complete(self, key, state):
        self.logger.info("worker %s finished with state %s", key, state)
        with self.lock:
            try:
                self.active_workers.pop(key)
            except KeyError as e:
                self.logger.error("errors occurs when remove worker %s", key)
                self.logger.exception(e)
        if self.on_complete is not None:
            try:
                self.on_complete(key, state)
            except Exception as e:
                self.logger.error("errors occur when calling complete callback.")
                self.logger.exception(e)

    def start(self):
        """
        star the main thread of executor.
        :return:
        """
        if self.main is not None:
            self.logger.info("executor has been started.")
            return self

        def executor_main():
            while True:
                result = self.out_queue.get()
                self._on_worker_complete(*result)

        self.main = Thread(target=executor_main)
        self.main.daemon = True
        self.main.start()
        return self

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
            self.logger.info("there are %d workers running and wait", workers)
            time.sleep(1)
        time.sleep(1)

    def terminate(self):
        """
        force all the worker to terminate
        :return:
        """
        with self.lock:
            for (key, worker) in self.active_workers.items():
                self.logger.info("will terminate worker %s", key)
                worker.terminate()
                worker.join()
