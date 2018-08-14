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


class service_stop:


    def __init__(self, service_conf, service_name):

        self.logger = logging.getLogger(__name__)

        self.service_conf = service_conf
        self.service_name = service_name



    def start(self):

        stop_script = "src/{0}/deploy/{1}".format(self.service_name, self.service_conf["stop-script"])

        cmd = "/bin/bash {0}".format(stop_script)
        err_msg = "Failed to execute the stop script of service {0}".format(self.service_name)
        self.logger.info("Begin to execute service {0}'s stop script.".format(self.service_name))
        linux_shell.execute_shell(cmd, err_msg)



    def run(self):

        self.start()

