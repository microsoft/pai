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
from multiprocessing import Queue
from datetime import timedelta
from cleaner.runtime.executor import Worker, RunningResult
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
