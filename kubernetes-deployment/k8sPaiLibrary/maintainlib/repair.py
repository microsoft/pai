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

import yaml
import os
import sys
import subprocess
import jinja2
import argparse
import paramiko
import common


class repair:

    """
    An class to reinstall
    """

    def __init__(self, cluster_config, node_config, clean):

        self.cluster_config = cluster_config
        self.node_config = node_config
        self.maintain_config = common.load_yaml_file("k8sPaiLibrary/maintainconf/repair.yaml")
        self.jobname = "repair"
        self.clean_flag = clean



    def prepare_package(self):

        common.maintain_package_wrapper(self.cluster_config, self.maintain_config, self.node_config, self.jobname)



    def delete_packege(self):

        common.maintain_package_cleaner(self.node_config)



    def job_executer(self):

        print "repair job begins !"

        # sftp your script to remote host with paramiko.
        srcipt_package = "repair.tar"
        src_local = "parcel-center/{0}".format(self.node_config["nodename"])
        dst_remote = "/home/{0}".format(self.node_config["username"])

        if common.sftp_paramiko(src_local, dst_remote, srcipt_package, self.node_config) == False:
            return

        commandline = "tar -xvf repair.tar && sudo ./repair/repair-worker-node.sh"

        if common.ssh_shell_paramiko(self.node_config, commandline) == False:
            return

        print "Successfully running repair job on node {0}".format(self.node_config["nodename"])



    def run(self):

        print "---- package wrapper is working now! ----"
        self.prepare_package()
        print "---- package wrapper's work finished ----"

        self.job_executer()

        if self.clean_flag == True:

            print "---- package cleaner is working now! ----"
            self.delete_packege()
            print "---- package cleaner's work finished! ----"


