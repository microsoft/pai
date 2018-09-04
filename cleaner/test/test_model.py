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
from cleaner.model.condition import Condition
from cleaner.model.action import Action
from cleaner.model.rule import Rule
from datetime import timedelta


def condition_method(data):
    return True


class ModelTest(TestCase):

    def test_condition(self):
        condition = Condition(key="test")
        self.assertTrue(condition.key == "test")

        condition.method = condition_method
        self.assertTrue(condition.method == condition_method)

        condition.owner = "tester"
        self.assertTrue(condition.owner == "tester")

        condition.version = "1.0"
        self.assertTrue(condition.version == "1.0")

        condition.input_data = "input"
        self.assertTrue(condition.input_data == "input")

    def test_action(self):
        action = Action(key="test")
        self.assertTrue(action.key == "test")

        action.owner = "tester"
        self.assertTrue(action.owner == "tester")

        action.version = "1.0"
        self.assertTrue(action.version == "1.0")

        action.command = "pwd"
        self.assertTrue(action.command == "pwd")

    def test_rule(self):
        rule = Rule(key="test")
        self.assertTrue(rule.key == "test")

        condition = Condition()
        rule.condition = condition
        self.assertTrue(rule.condition == condition)

        action = Action()
        rule.action = action
        self.assertTrue(rule.action == action)

        rule.owner = "tester"
        self.assertTrue(rule.owner == "tester")

        rule.version = "1.0"
        self.assertTrue(rule.version == "1.0")

        timeout = timedelta(minutes=1)
        rule.action_timeout = timeout
        self.assertTrue(rule.action_timeout == timeout)


if __name__ == "__main__":
    main()
