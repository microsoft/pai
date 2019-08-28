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
import forward_compatibility
from ..paiLibrary.common import file_handler
from ..paiLibrary.common import directory_handler
from ..paiLibrary.common import linux_shell

class ServiceConfigUpdate:

    def __init__(self, config_path):
        self.logger = logging.getLogger(__name__)
        self.config_path = config_path


    def run(self):
        service_configuration = file_handler.load_yaml_config("{0}/services-configuration.yaml".format(self.config_path))
        self.overwrite_service_configuration, updated = forward_compatibility.service_configuration_convert(service_configuration)

        if updated is True:
            self.logger.warning("=======================================================================")
            self.logger.warning("============  Your service configuration is out of date. ==============")
            self.logger.warning("=======================================================================")
            self.logger.warning("============    Following Operation Will Be Performed    ==============")
            self.logger.warning("==== service-configuration.yaml -> service-configuraiton.yaml.old =====")
            self.logger.warning("= a new service-configuraiton.yaml with latest format will be created =")
            self.logger.warning("=======================================================================")

            linux_shell.execute_shell(
                "mv {0}/services-configuration.yaml {0}/services-configuration.yaml.old".format(self.config_path),
                "failed to mv the old services-configuration.yaml"
            )
            file_handler.dump_yaml_data("{0}/services-configuration.yaml".format(self.config_path), self.overwrite_service_configuration)

            self.logger.warning("=======================================================================")
            self.logger.warning("===============  Process will continue after 15s.    ==================")
            self.logger.warning("=======================================================================")
            time.sleep(15)
