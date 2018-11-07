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

import mainParser

from ..paiLibrary.common import file_handler



package_directory_com = os.path.dirname(os.path.abspath(__file__))



class cluster_object_model:

    def __init__(self, configuration_path):
        self.configuration_path = configuration_path
        self.cluster_configuration = file_handler.load_yaml_config("{0}/cluster-configuration.yaml".format(configuration_path))
        self.overwirte_service_configuration = file_handler.load_yaml_config("{0}/services-configuration.yaml".format(configuration_path))
        self.kubernetes_configuration = file_handler.load_yaml_config("{0}/kubernetes-configuration.yaml".format(configuration_path))
        self.cluster_object_model = dict()



    def get_service_model_list(self):
        sub_model_list = []

        sub_dir_list = file_handler.get_file_list_in_path("{0}/../../src/".format(package_directory_com))
        for sub_dir_name in sub_dir_list:
            parser_path = "{0}/../../src/{1}/config/{1}.py".format(sub_dir_name)
            if file_handler.file_exist_or_not(parser_path):
                sub_model_list.append(sub_dir_name)

        return sub_model_list



    def init_service_parser(self, service_name):
        sys.path.insert(0, '{0}/../../src/{1}/config'.format(package_directory_com, service_name))
        default_path = "{0}/../../src/{1}/config/{1}.yaml".format(service_name)

        # Prepare Service Configuration
        cluster_cfg = self.cluster_configuration

        default_service_cfg = []
        if file_handler.file_exist_or_not(default_path):
            default_service_cfg = file_handler.load_yaml_config(default_path)

        overwrite_service_cfg = []
        if service_name in self.overwirte_service_configuration:
            overwrite_service_cfg = self.overwirte_service_configuration[service_name]

        # Init parser instance
        parser_module = importlib.import_module(service_name)
        service_parser_class = getattr(parser_module, service_name)
        parser_instance = service_parser_class(cluster_cfg, overwrite_service_cfg, default_service_cfg)

        sys.path.remove('{0}/../../src/{1}/config'.format(package_directory_com, service_name))

        return parser_instance



    def init_main_parser(self):
        None




    def init_all_parser(self):

        parser_dict = []
        service_model_list = self.get_service_model_list()

        for service_name in service_model_list:
            parser_dict[service_name] = self.init_service_parser(service_name)


        main_model_list = self.
        for main_name in



    def run(self):

        parser_dict = self.init_all_parser()


