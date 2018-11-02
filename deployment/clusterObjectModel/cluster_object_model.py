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
import importlib

from ..paiLibrary.common import file_handler


package_directory_com = os.path.dirname(os.path.abspath(__file__))



class cluster_object_model:

    def __init__(self, configuration_path):
        self.configuration_path = configuration_path
        self.cluster_object_model = dict()



    def get_service_model_list(self):
        sub_model_list = []

        sub_dir_list = file_handler.get_file_list_in_path("{0}/../../src/".format(package_directory_com))
        for sub_dir_name in sub_dir_list:
            parser_path = "{0}/../../src/{1}/config/{1}.py".format(sub_dir_name)
            if file_handler.file_exist_or_not(parser_path):
                sub_model_list.append(sub_dir_name)

        return sub_model_list



    def call_service_parser(self, service_name):
        sys.path.insert(0, '{0}/../../src/{1}/config'.format(package_directory_com, service_name))
        default_path = "{0}/../../src/{1}/config/{1}.yaml".format(service_name)
        parser_module = importlib.import_module(service_name)



    def call_main_parser(self):
        None



    def run(self):
        service_model_list = self.get_service_model_list()
