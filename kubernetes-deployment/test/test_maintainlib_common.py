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

import unittest
import filecmp
import yaml
import sys

from ..maintainlib import common



class TestMaintainlibCommon(unittest.TestCase):

    """
    Test the common's api
    """

    def setUp(self):

        sys.path.append("data")



    def tearDown(self):
        pass



    def test_yaml_lod(self):
        pass



    def test_template2generated(self):

        cluster_data = {
            'clusterinfo' : {
                'testkey2' : 'testkey2'
            },
            'testkey3': 'testkey3'
        }

        host_data = {
            'testkey1': 'testkey1'
        }

        template_data = common.read_template("data_maintainlib_common/test.yaml")
        generated_data = common.generate_from_template(template_data, cluster_data, host_data)
        common.write_generated_file(generated_data, "data_maintainlib_common/output.yaml")

        self.assertTrue(filecmp.cmp("data_maintainlib_common/test.yaml", "data_maintainlib_common/output.yaml"))









if __name__ == '__main__':
    unittest.main()
