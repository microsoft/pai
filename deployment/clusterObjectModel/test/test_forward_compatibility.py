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


import os
import sys
import unittest
import yaml
import logging
import logging.config

from ...clusterObjectModel import forward_compatibility
from ...paiLibrary.common import file_handler


package_directory_com = os.path.dirname(os.path.abspath(__file__))


class TestClusterObjectModel(unittest.TestCase):

    def setUp(self):

        try:

            os.chdir(package_directory_com)

        except:

            pass

        configuration_path = "data/test_logging.yaml"

        if os.path.exists(configuration_path):
            with open(configuration_path, 'rt') as f:
                logging_configuration = yaml.safe_load(f.read())

            logging.config.dictConfig(logging_configuration)

            logging.getLogger()



    def test_service_configuration_convert(self):

        ser_cfg_before_convert = "data/forward_compatibility_data/service-configuration.yaml"
        ser_cfg_after_convert = "data/forward_compatibility_data/after-convert-service-configuration.yaml"

        ser_cfg = file_handler.load_yaml_config(ser_cfg_before_convert)
        ser_cfg_after_standard = file_handler.load_yaml_config(ser_cfg_after_convert)
        ser_cfg_after = forward_compatibility.service_configuration_convert(ser_cfg)

        print "Generated:"
        print ser_cfg_after

        print "Standard:"
        print ser_cfg_after_standard

        self.assertTrue(
            ser_cfg_after == ser_cfg_after_standard
        )