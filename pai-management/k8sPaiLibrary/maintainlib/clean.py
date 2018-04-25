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

import common
import logging
import logging.config


class clean:

    """

    An class to destroy whole cluster.

    """

    def __init__(self, cluster_config, **kwargs):

        self.logger = logging.getLogger(__name__)

        self.cluster_config = cluster_config
        self.maintain_config = common.load_yaml_file("k8sPaiLibrary/maintainconf/clean.yaml")
        self.clean_flag = kwargs["clean"]
        self.jobname = "clean"




    def prepare_package(self, node_config):

        common.maintain_package_wrapper(self.cluster_config, self.maintain_config, node_config, self.jobname)



    def delete_packege(self, node_config):

        common.maintain_package_cleaner(node_config)



    def job_executer(self, node_config):

        self.logger.info("{0} job begins !".format(self.jobname))

        # sftp your script to remote host with paramiko.
        srcipt_package = "{0}.tar".format(self.jobname)
        src_local = "parcel-center/{0}".format(node_config["nodename"])
        dst_remote = "/home/{0}".format(node_config["username"])

        if common.sftp_paramiko(src_local, dst_remote, srcipt_package, node_config) == False:
            return

        commandline = "tar -xvf {0}.tar".format(self.jobname, node_config['hostip'])
        if common.ssh_shell_paramiko(node_config, commandline) == False:
            self.logger.error("Failed to uncompress {0}.tar".format(self.jobname))
            return

        commandline = "sudo ./{0}/kubernetes-cleanup.sh".format(self.jobname)
        if common.ssh_shell_paramiko(node_config, commandline) == False:
            self.logger.error("Failed to cleanup the kubernetes deployment on {0}".format(node_config['hostip']))
            return

        self.logger.info("Successfully running {0} job on node {1}".format(self.jobname, node_config["nodename"]))



    def remote_host_cleaner(self, node_config):

        commandline = "sudo rm -rf {0}*".format(self.jobname)

        if common.ssh_shell_paramiko(node_config, commandline) == False:
            return



    def run(self):


        self.logger.warning("Begin to destroy whole cluster.")
        self.logger.warning("After destorying, all kubenretes's metadata will be deleted and etcd will be cleaned too.")


        for role in self.cluster_config["remote_deployment"]:
            listname = self.cluster_config["remote_deployment"][role]["listname"]

            if listname not in self.cluster_config:
                continue

            for node_key in self.cluster_config[listname]:
                node_config = self.cluster_config[listname][node_key]
                self.logger.info("Begin to clean data on host {0}".format(node_config["hostip"]))
                self.prepare_package(node_config)
                self.job_executer(node_config)

                if self.clean_flag == True:
                    self.logger.info(" package cleaner is working on the folder of {0}!".format(node_config["hostip"]))
                    self.delete_packege(node_config)
                    self.logger.info(" package cleaner's work finished! ")

                    self.logger.info(" remote host cleaner is working on the host of {0}!".format(node_config["hostip"]))
                    self.remote_host_cleaner(node_config)
                    self.logger.info(" remote host cleaning job finished! ")


        self.logger.info("The kubernetes has been destroyed, and metadata has been removed")


