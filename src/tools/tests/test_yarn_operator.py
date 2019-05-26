# -*- coding: utf-8 -*-
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
