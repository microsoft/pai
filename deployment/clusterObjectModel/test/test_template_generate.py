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

from ...paiLibrary.common import directory_handler
from ...paiLibrary.common import file_handler
from ...clusterObjectModel.cluster_object_model import cluster_object_model
from ...paiLibrary.paiService.service_template_generate import service_template_generate
from ...paiLibrary.paiService.service_template_clean import  service_template_clean


package_directory_com = os.path.dirname(os.path.abspath(__file__))


class TestTemplateGenerate(unittest.TestCase):

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



    def test_template_generate(self):

        com_handler = cluster_object_model("{0}/data/configuration-template-generate".format(package_directory_com))
        com = com_handler.service_config()
        src_path = "{0}/../../../src".format(package_directory_com)

        service_list = list()

        subdir_list = directory_handler.get_subdirectory_list(src_path)
        for subdir in subdir_list:
            service_deploy_dir = "{0}/{1}/deploy".format(src_path, subdir)
            service_deploy_conf_path = "{0}/{1}/deploy/service.yaml".format(src_path, subdir)
            if file_handler.directory_exits(service_deploy_dir) and file_handler.file_exist_or_not(service_deploy_conf_path):
                service_conf = file_handler.load_yaml_config(service_deploy_conf_path)
                if ("cluster-type" not in service_conf) or ("cluster-type" in service_conf and "yarn" in service_conf["cluster-type"]):
                    service_list.append(subdir)

        for serv in service_list:
            service_conf = file_handler.load_yaml_config("{0}/{1}/deploy/service.yaml".format(src_path, serv))
            service_template_generater = service_template_generate(com, serv, service_conf)
            service_template_generater.run()
            service_template_cleaner = service_template_clean(serv, service_conf)
            service_template_cleaner.run()

