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

import logging
import logging.config

from ..common import linux_shell



class hadoop_ai_build:

    def __init__(self, os_type = "ubuntu16.04", hadoop_version = "2.9.0", hadoop_customize_path = None):

        self.logger = logging.getLogger(__name__)

        self.hadoop_version = hadoop_version
        self.hadoop_customize_path = hadoop_customize_path
        self.os_type = os_type


    def build(self):

        if self.hadoop_customize_path == "None":
            self.logger.warning("Because  the property of custom_hadoop_binary_path in your service-configuration.yaml is None.")
            self.logger.warning("The process of hadoop-ai build will be skipped.")
            return

        self.logger.info("Hadoop AI will be built soon.")
        self.logger.info("The hadoop AI binary will be found at the path [ {0} ]".format(self.hadoop_customize_path))

        commandline = "./paiLibrary/managementTool/{0}/hadoop-ai-build.sh {1}".format(self.os_type, self.hadoop_customize_path)
        error_msg = "Failed to build hadoop-ai."
        linux_shell.execute_shell(commandline, error_msg)

        self.logger.info("Successfully. Hadoop AI build finished.")


