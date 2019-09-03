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

import sys
import subprocess
import logging
import time
import logging.config
#
from . import service_template_generate
from . import service_template_clean
from . import service_management_configuration
#
from ..common import directory_handler
from ..common import file_handler


class serivce_management_start:

    def __init__(self, kube_config_path=None, service_list=None, **kwargs):
        self.logger = logging.getLogger(__name__)

        self.cluster_object_model = service_management_configuration.get_cluster_object_model_from_k8s(kube_config_path)
        self.kube_config_path = kube_config_path
        self.cluster_type = None

        if service_list is None:
            if "cluster-type" in self.cluster_object_model["cluster"]["common"]:
                self.cluster_type = self.cluster_object_model["cluster"]["common"]["cluster-type"]
            self.service_list = service_management_configuration.get_service_list(self.cluster_type)
        else:
            self.service_list = service_list
        self.logger.info("Get the service-list to manage : {0}".format(str(self.service_list)))

        self.retry_times = 5
        if "retry_times" in kwargs:
            self.retry_times = kwargs["retry_times"]

    def start_service(self, service_conf, service_name):
        from ..common import linux_shell
        start_script = "src/{0}/deploy/{1}".format(service_name, service_conf["start-script"])

        cmd = "/bin/bash {0}".format(start_script)
        err_msg = "Failed to execute the start script of service {0}".format(service_name)
        self.logger.info("Begin to execute service {0}'s start script.".format(service_name))
        linux_shell.execute_shell_raise(cmd, err_msg)

    def start(self, serv):

        if serv in self.done_dict and self.done_dict[serv] == True:
            return

        service_conf = file_handler.load_yaml_config("src/{0}/deploy/service.yaml".format(serv))

        dependency_list = service_conf.get("prerequisite")
        if dependency_list != None:
            for fat_serv in dependency_list:
                if fat_serv not in self.service_list:
                    continue
                if fat_serv in self.done_dict and self.done_dict[fat_serv] == True:
                    continue
                self.start(fat_serv)

        try_counts = 0
        while True:

            try:
                self.logger.info("-----------------------------------------------------------")
                self.logger.info("Begin to generate service {0}'s template file".format(serv))
                service_template_generater = service_template_generate.service_template_generate(self.cluster_object_model, serv, service_conf)
                service_template_generater.run()

                self.logger.info("Begin to start service: [ {0} ]".format(serv))
                self.start_service(service_conf, serv)

                self.logger.info("Begin to clean all service's generated template file".format(serv))
                service_template_cleaner = service_template_clean.service_template_clean(serv, service_conf)
                service_template_cleaner.run()

                self.logger.info("Successfully start {0}".format(serv))
                self.logger.info("-----------------------------------------------------------")
                break

            except subprocess.CalledProcessError:
                self.logger.error("Failed to start service {0}".format(serv))
                self.logger.info("-----------------------------------------------------------")

                try_counts = try_counts + 1
                if try_counts >= self.retry_times:
                    self.logger.error("Have retried {0} times, but service {1} doesn't start. Please check it.".format(self.retry_times, serv))
                    sys.exit(1)

                time.sleep(10)

            except Exception as error:
                self.logger.exception("Some error occurs when starting service {0}".format(serv))
                sys.exit(1)

        self.done_dict[serv] = True

    def run(self):
        self.done_dict = dict()

        for serv in self.service_list:
            if file_handler.file_exist_or_not("src/{0}/deploy/service.yaml".format(serv)) == False:
                self.logger.warning("service.yaml can't be found on the directory of {0}".format(serv))
                self.logger.warning("Please check your source code. The {0}'s service will be skipped.".format(serv))
                continue
            if serv in self.done_dict and self.done_dict[serv] == True:
                continue
            self.start(serv)
