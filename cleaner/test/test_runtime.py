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


from unittest import TestCase, main
import multiprocessing
import logging
from logging.handlers import RotatingFileHandler
from multiprocessing import Queue
from datetime import timedelta
from cleaner.runtime.executor import Worker, RunningResult, Executor
from cleaner.model.rule import Rule
from cleaner.model.action import Action
from cleaner.model.condition import Condition


def condition_true(data):
    return True


def condition_false(data):
    return False


class TestWorker(TestCase):

    def setUp(self):
        self.true = Condition(key="true", method=condition_true)
        self.false = Condition(key="false", method=condition_false)

        self.good_action = Action(command="pwd")
        self.bad_action = Action(command="bad_command")
        self.loop_action = Action(command="while true; do sleep 1; done")

        setup_logging()

    def testWorkerConditionTrue(self):
        rule = Rule(key="TestWorkerConditionTrue", condition=self.true, action=self.good_action)
        queue = Queue()
        worker = Worker(rule.key, rule, queue)
        worker.start()

        result = queue.get()
        self.assertTrue(result == (rule.key, RunningResult.SUCCESS))

    def testWorkerConditionFalse(self):
        rule = Rule(key="TestWorkerConditionFalse", condition=self.false, action=self.good_action)
        queue = Queue()
        worker = Worker(rule.key, rule, queue)
        worker.start()

        result = queue.get()
        self.assertTrue(result == (rule.key, RunningResult.FALSE_CONDITION))

    def testWorkerBadCommand(self):
        rule = Rule(key="TestWorkerBadCommand", condition=self.true, action=self.bad_action)
        queue = Queue()
        worker = Worker(rule.key, rule, queue)
        worker.start()

        result = queue.get()
        self.assertTrue(result == (rule.key, RunningResult.FAILED))

    def testWorkerTimeout(self):
        rule = Rule(key="TestWorkerTimeout", condition=self.true, action=self.loop_action, action_timeout=timedelta(seconds=1))
        queue = Queue()
        worker = Worker(rule.key, rule, queue)
        worker.start()

        result = queue.get()
        self.assertTrue(result == (rule.key, RunningResult.TIMEOUT))


class TestExecutor(TestCase):

    def setUp(self):
        self.true = Condition(key="TestExecutorCondition", method=condition_true)
        self.action_pwd = Action(key="TestExecutorAction", command="pwd")
        self.action_sleep = Action(key="TestExecutorAction", command="sleep 1")

        setup_logging()

    def testExecRuleSuccess(self):
        self.success = False

        def on_complete(key, state):
            self.success = True if state == RunningResult.SUCCESS else False

        executor = Executor(complete_callback=on_complete).start()
        rule = Rule(key="TestRule", condition=self.true, action=self.action_pwd)
        executor.run_async(rule.key, rule).end()
        self.assertTrue(self.success, "The rule failed.")

    def testExecRuleTimeout(self):
        self.timeout = False

        def on_complete(key, state):
            self.timeout = True if state == RunningResult.TIMEOUT else False

        action = Action(key="TimeoutAction", command="sleep 10")
        rule = Rule(key="TimeoutRule", condition=self.true, action=action, action_timeout=timedelta(seconds=1))
        executor = Executor(complete_callback=on_complete).start()
        executor.run_async(rule.key, rule).end()
        self.assertTrue(self.timeout, "the action should timeout")

    def testExecDuplicateRule(self):
        self.once = 0

        def on_complete(key, state):
            if state == RunningResult.SUCCESS:
                self.once += 1

        rule = Rule(key="TestRule", condition=self.true, action=self.action_sleep, action_timeout=timedelta(seconds=10))
        executor = Executor(complete_callback=on_complete).start()
        executor.run_async(rule.key, rule).run_async(rule.key, rule).end()
        self.assertTrue(self.once == 1, "the rule should be executed only once")

    def testExecMultipleRules(self):
        self.two = 0

        def on_complete(key, state):
            if state == RunningResult.SUCCESS:
                self.two += 1

        executor = Executor(complete_callback=on_complete).start()
        rule = Rule(key="SleepRule", condition=self.true, action=self.action_sleep)
        executor.run_async(rule.key, rule)
        rule = Rule(key="PwdRule", condition=self.true, action=self.action_pwd)
        executor.run_async(rule.key, rule).end()
        self.assertTrue(self.two == 2, "two rules should be executed successfully")

    def testExecTerminate(self):
        self.terminate = True

        def on_complete(key, state):
            self.terminate = False

        executor = Executor(complete_callback=on_complete).start()
        rule = Rule(key="SleepRule", condition=self.true, action=self.action_sleep)
        executor.run_async(rule.key, rule).terminate()
        self.assertTrue(self.terminate, "worker should be terminated and rule should not be completed.")

    def testExecException(self):

        def on_complete(key, state):
            raise Exception()

        executor = Executor(complete_callback=on_complete).start()
        rule = Rule(key="PwdRule", condition=self.true, action=self.action_pwd)
        executor.run_async(rule.key, rule)
        self.assertTrue(executor.main.is_alive(), "the daemon thread should not exit.")


def setup_logging():
    root = multiprocessing.get_logger()
    if len(root.handlers) == 0:
        handler = RotatingFileHandler("/tmp/cleaner_test.log", maxBytes=1024 * 1024 * 20, backupCount=10)
        formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(filename)s:%(lineno)s - %(message)s")
        handler.setFormatter(formatter)
        root.addHandler(handler)
        root.setLevel(logging.INFO)


if __name__ == "__main__":
    setup_logging()
    main()
