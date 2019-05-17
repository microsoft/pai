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

from ..clusterObjectModel import cluster_object_model
from ..k8sPaiLibrary.maintainlib import common

import sys
import readline
import logging
import logging.config


class OpenPaiSftpCopy:

    def __init__(self, filename, source, dest, machine_list, filter):
        self.filename = filename
        self.source = source
        self.dest = dest
        self.origin_machine_list = machine_list
        self.filter_rule = filter
        self.machine_list = {}

        self.logger = logging.getLogger(__name__)


    def construct_machine_list(self):
        rule_list = []
        self.logger.info("=============================================")
        self.logger.info("================ Filter Rule ================")
        self.logger.info("=============================================")
        if self.filter_rule != None:
            for rule in self.filter_rule:
                kv = rule.split("=")
                rule_list.append({"key":kv[0], "value":kv[1]})
                self.logger.info("key = {0}, value = {1}".format(kv[0], kv[1]))
        else:
            self.logger.info("No filter rule.")
        self.logger.info("\n")
        self.logger.info("\n")

        self.logger.info("=============================================")
        self.logger.info("======= Machine List After filtered =========")
        self.logger.info("=============================================")
        for hostname in self.origin_machine_list:
            host = self.origin_machine_list[hostname]
            for rule in rule_list:
                if rule["key"] not in host:
                    break
                if host[rule["key"]] != rule["value"]:
                    break
            else:
                self.machine_list[hostname] = host
                self.logger.info("Machine Host Name: {0},   Machine Ip Address: {1}".format(hostname, host["hostip"]))
        self.logger.info("\n")
        self.logger.info("\n")

        count_input = 0
        while True:
            user_input = raw_input("Do you want to continue this operation? (Y/N) ")
            if user_input == "N":
                sys.exit(1)
            elif user_input == "Y":
                break
            else:
                print(" Please type Y or N.")
            count_input = count_input + 1
            if count_input == 3:
                self.logger.warning("3 Times.........  Sorry,  we will force stopping your operation.")
                sys.exit(1)

    def run(self):

        self.construct_machine_list()

        for hostname in self.machine_list:
            host = self.machine_list[hostname]
            if common.sftp_paramiko(self.source, self.dest, self.filename, host) == False:
                self.logger.error("[ Failed ]: Task on the machine [ hostname: {0},  ip-address: {1} ]".format(hostname, host["hostip"]))
            else:
                self.logger.info("[ Successful ]: Task on the machine [ hostname: {0},  ip-address: {1} ]".format(hostname, host["hostip"]))
