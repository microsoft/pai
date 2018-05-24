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


import time
import logging
import logging.config

import service_stop
import service_template_generate
import service_template_clean
from ..common import directory_handler
from ..common import file_handler



class service_management_stop:


    def __init__(self, cluster_object_model, service_list = None, **kwargs):
        self.logger = logging.getLogger(__name__)

        self.cluster_object_model = cluster_object_model

        if service_list == None:
            self.service_list = self.get_service_list()
        else:
            self.service_list = service_list



    def get_service_list(self):

        service_list = list()

        subdir_list = directory_handler.get_subdirectory_list("bootstrap/")
        for subdir in subdir_list:

            service_conf_path =  "bootstrap/{0}/service.yaml".format(subdir)
            if file_handler.file_exist_or_not(service_conf_path):
                service_list.append(subdir)

        self.logger.info("Get the service-list to manage : {0}".format(str(service_list)))

        return service_list



    def start(self, serv):

        service_conf = file_handler.load_yaml_config("bootstrap/{0}/service.yaml".format(serv))
        service_stopper = service_stop.service_stop(service_conf, serv)

        self.logger.info("----------------------------------------------------------------------")
        self.logger.info("Begin to generate service {0}'s template file".format(serv))

        service_template_generater = service_template_generate.service_template_generate(self.cluster_object_model,
                                                                                         serv, service_conf)
        service_template_generater.run()

        self.logger.info("Begin to stop service: [ {0} ]".format(serv))
        service_stopper.run()

        self.logger.info("Begin to clean service's generated template file".format(serv))
        service_template_cleaner = service_template_clean.service_template_clean(serv, service_conf)
        service_template_cleaner.run()

        self.logger.info("Successfully stop {0}".format(serv))
        self.logger.info("----------------------------------------------------------------------")



    def run(self):

        for serv in self.service_list:
            if serv == "cluster-configuration":
                continue
            if file_handler.file_exist_or_not("bootstrap/{0}/service.yaml".format(serv)) == False:
                self.logger.warning("service.yaml can't be found on the directory of {0}".format(serv))
                self.logger.warning("Please check your source code. The {0}'s service will be skipped.".format(serv))
                continue
            self.start(serv)

        if "cluster-configuration" in self.service_list:
            self.start("cluster-configuration")


