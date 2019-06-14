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

from __future__ import absolute_import

from mock import patch
import unittest

from operator_wrapper.yarn_operator import YarnOperator


class YarnOperatorTestCase(unittest.TestCase):

    def setUp(self):
        with patch("operator_wrapper.yarn_operator.YarnOperator.setup_yarn_configfile"):
            self.yarnOperator = YarnOperator("localhost")

    @patch("operator_wrapper.yarn_operator.YarnOperator.setup_yarn_configfile")
    def test__init__(self, setup_yarn_configfile):
        YarnOperator("127.0.0.1")
        setup_yarn_configfile.assert_called_with()


    def test_generate_queue_update_xml(self):
        from collections import OrderedDict
        from xml.dom.minidom import parseString
        raw_dict = OrderedDict([
            ("global-updates", [
                OrderedDict([("key", "yarn.scheduler.capacity.root.default.default-node-label-expression"),
                             ("value", "label_non")]),
                OrderedDict([("key", "yarn.scheduler.capacity.root.default.accessible-node-labels.label_ex.capacity"),
                             ("value", 0)]),

            ])
        ])
        dom = parseString(self.yarnOperator.generate_queue_update_xml(raw_dict))
        expect_output = '''<?xml version="1.0" ?>
<sched-conf>
	<global-updates>
		<entry>
			<key>yarn.scheduler.capacity.root.default.default-node-label-expression</key>
			<value>label_non</value>
		</entry>
		<entry>
			<key>yarn.scheduler.capacity.root.default.accessible-node-labels.label_ex.capacity</key>
			<value>0</value>
		</entry>
	</global-updates>
</sched-conf>
'''
        self.assertEquals(dom.toprettyxml(), expect_output)


if __name__ == "__main__":
    unittest.main()
