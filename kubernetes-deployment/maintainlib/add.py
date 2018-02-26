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
import time


class add:

    """
    An class to add new node
    """

    def __init__(self, cluster_config, node_config, clean):

        self.cluster_config = cluster_config
        self.node_config = node_config
        self.maintain_config = common.load_yaml_file("maintainconf/add.yaml")
        self.clean_flag = clean

        if node_config['role'] == 'worker':

            self.jobname = "add-worker-node"

        else:

            self.jobname = "error"

            print "[{0}] Error: {1} is an undefined role, quit add job in host [{2}]".format(time.asctime(), node_config['role'], node_config['nodename'])



    def prepare_package(self):

        if self.jobname == 'error':
            return

        common.maintain_package_wrapper(self.cluster_config, self.maintain_config, self.node_config, self.jobname)



    def delete_packege(self):

        if self.jobname == 'error':
            return

        common.maintain_package_cleaner(self.node_config)



    def job_executer(self):

        if self.jobname == 'error':
            return

        print "{0} job begins !".format(self.jobname)

        # sftp your script to remote host with paramiko.
        srcipt_package = "{0}.tar".format(self.jobname)
        src_local = "parcel-center/{0}".format(self.node_config["nodename"])
        dst_remote = "/home/{0}".format(self.node_config["username"])

        if common.sftp_paramiko(src_local, dst_remote, srcipt_package, self.node_config) == False:
            return

        commandline = "tar -xvf {0}.tar && sudo ./{0}/{0}.sh {1}:8080 {2} {3}".format(self.jobname, self.cluster_config['clusterinfo']['api-servers-ip'], self.node_config['username'], self.node_config['hostip'])

        if common.ssh_shell_paramiko(self.node_config, commandline) == False:
            return

        print "Successfully running {0} job on node {1}".format(self.jobname, self.node_config["nodename"])



    def run(self):

        if self.jobname == 'error':
            return

        print "---- package wrapper is working now! ----"
        self.prepare_package()
        print "---- package wrapper's work finished ----"

        self.job_executer()

        if self.clean_flag == True:

            print "---- package cleaner is working now! ----"
            self.delete_packege()
            print "---- package cleaner's work finished! ----"
