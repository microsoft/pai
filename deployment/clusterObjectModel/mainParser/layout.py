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

from ...k8sPaiLibrary.maintainlib import common as pai_k8s_common


class Layout:

    def __init__(self, layout_configuration):
        self.logger = logging.getLogger(__name__)
        self.layout_configuration = layout_configuration



    def validation_pre(self):
        # TODO

        # validate unique hostname
        host_list = [host["hostname"] for host in self.layout_configuration["machine-list"]]
        duplicate_host_list = set([host for host in host_list if host_list.count(host) > 1])
        if duplicate_host_list:
            return False, "duplicate hostname [{}] in kubernetes-configuration".format(", ".join(duplicate_host_list))

        return True, None



    def validation_post(self, cluster_object_model):
        return True, None



    def run(self):
        com_layout = dict()
        com_layout["machine-sku"] = self.layout_configuration["machine-sku"]
        com_layout["kubernetes"] = self.layout_configuration["kubernetes"]
        com_layout["machine-list"] = dict()

        for host in self.layout_configuration["machine-list"]:
            com_layout["machine-list"][host["hostname"]] = host

        return com_layout

