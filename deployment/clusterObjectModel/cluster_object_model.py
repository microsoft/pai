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
import logging
import logging.config


from . import forward_compatibility
from ..paiLibrary.common import file_handler
from ..paiLibrary.common import directory_handler
from .mainParser import kubernetes as pai_com_kubernetes
from .mainParser import machine as pai_com_machine
from .mainParser import layout as pai_com_layout


package_directory_com = os.path.dirname(os.path.abspath(__file__))



class cluster_object_model:

    def __init__(self, configuration_path):
        self.logger = logging.getLogger(__name__)
        self.configuration_path = configuration_path
        overwirte_service_configuration = file_handler.load_yaml_config("{0}/services-configuration.yaml".format(configuration_path))
        self.overwirte_service_configuration = forward_compatibility.service_configuration_convert(overwirte_service_configuration)
        self.kubernetes_configuration = file_handler.load_yaml_config("{0}/kubernetes-configuration.yaml".format(configuration_path))
        self.layout = file_handler.load_yaml_config("{0}/layout.yaml".format(configuration_path))
        self.cluster_object_model = dict()



    def get_service_model_list(self):
        sub_model_list = []

        sub_dir_list = directory_handler.get_subdirectory_list("{0}/../../src/".format(package_directory_com))
        for sub_dir_name in sub_dir_list:
            parser_path = "{0}/../../src/{1}/config/{2}.py".format(package_directory_com, sub_dir_name, sub_dir_name.replace("-", "_"))
            if file_handler.file_exist_or_not(parser_path):
                sub_model_list.append(sub_dir_name)
        return sub_model_list



    def get_service_parser(self, service_name):

        sys.path.insert(0, '{0}/../../src/{1}/config'.format(package_directory_com, service_name))
        default_path = "{0}/../../src/{1}/config/{1}.yaml".format(package_directory_com, service_name)

        # Prepare Service Configuration
        layout = self.layout

        default_service_cfg = []
        if file_handler.file_exist_or_not(default_path):
            default_service_cfg = file_handler.load_yaml_config(default_path)

        overwrite_service_cfg = {}
        if self.overwirte_service_configuration is not None and service_name in self.overwirte_service_configuration:
            overwrite_service_cfg = self.overwirte_service_configuration[service_name]

        # Init parser instance
        parser_module = importlib.import_module(service_name.replace("-", "_"))
        parser_class_name = service_name.replace("-", " ").title().replace(" ", "")
        service_parser_class = getattr(parser_module, parser_class_name)
        parser_instance = service_parser_class(layout, overwrite_service_cfg, default_service_cfg)

        sys.path.remove('{0}/../../src/{1}/config'.format(package_directory_com, service_name))

        return parser_instance

    def init_service_parser(self):
        parser_dict = dict()
        parser_dict["layout"] = pai_com_layout.Layout(self.layout)

        service_model_list = self.get_service_model_list()
        for service_name in service_model_list:
            parser_dict[service_name] = self.get_service_parser(service_name)
        return parser_dict



    def init_kubernetes_parser(self):
        parser_dict = dict()

        # init main parser
        kubernetes_parser = pai_com_kubernetes.Kubernetes(self.layout, self.kubernetes_configuration)
        parser_dict["kubernetes"] = kubernetes_parser
        parser_dict["layout"] = pai_com_layout.Layout(self.layout)

        return parser_dict



    # TODO refine later
    def xxxrun(self, parser_dict):

        # Pre Validation
        self.logger.info("Begin to do pre-validation for each service parser.")
        for key in parser_dict.iterkeys():
            value = parser_dict[key]
            self.logger.info("Begin to do pre-validation of {0}".format(key))
            ok, msg = value.validation_pre()
            if ok is False:
                self.logger.error(msg)
                sys.exit(1)
            self.logger.info("Pre-validation of {0} is passed".format(key))
        self.logger.info("Pre-validation is successful!")

        # Generate object model
        self.logger.info("Begin to do generate cluster object model.")
        for key in parser_dict.iterkeys():
            value = parser_dict[key]
            self.logger.info("Begin to do generate object model of {0}.".format(key))
            self.cluster_object_model[key] = value.run()
            self.logger.info("Object model of {0} is generated.".format(key))
        self.logger.info("Cluster Object Model is generated.")

        # Post Validation
        self.logger.info("Begin to do post-validation.")
        for key in parser_dict.iterkeys():
            value = parser_dict[key]
            self.logger.info("Begin to do post-validation of {0}.".format(key))
            ok, msg = value.validation_post(self.cluster_object_model)
            if ok is False:
                self.logger.error(msg)
                sys.exit(1)
            self.logger.info("Post-validation of {0} is passed.".format(key))
        self.logger.info("Post-validation is successful!")

        return self.cluster_object_model

    def service_config(self):
        return self.xxxrun(self.init_service_parser())

    def kubernetes_config(self):
        return self.xxxrun(self.init_kubernetes_parser())
