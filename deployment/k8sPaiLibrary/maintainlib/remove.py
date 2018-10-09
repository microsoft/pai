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
import logging
import logging.config

from . import common as pai_common



package_directory_remove = os.path.dirname(os.path.abspath(__file__))



class remove:

    """
    An class to remove the node from current pai's k8s cluster.
    """

    def __init__(self, cluster_config, node_config, clean):

        self.logger = logging.getLogger(__name__)

        self.cluster_config = cluster_config
        self.node_config = node_config
        maintain_configuration_path = os.path.join(package_directory_remove, "../maintainconf/remove.yaml")
        self.maintain_config = common.load_yaml_file(maintain_configuration_path)
        self.clean_flag = clean
        self.jobname = "remove-node"




    def prepare_package(self, node_config, jobname):

        common.maintain_package_wrapper(self.cluster_config, self.maintain_config, node_config, jobname)



    def delete_packege(self, node_config):

        common.maintain_package_cleaner(node_config)



    def job_executer_clean_up_node(self):

        self.logger.info("{0} job begins !".format(self.jobname))

        commandline = "kubectl delete node {0}".format(self.node_config['nodename'])
        common.execute_shell_return(
            commandline,
            "Failed to delete  node {0}".format(self.node_config['nodename'])
        )

        # sftp your script to remote host with paramiko.
        srcipt_package = "{0}.tar".format(self.jobname)
        src_local = "parcel-center/{0}".format(self.node_config["nodename"])
        dst_remote = common.get_user_dir(self.node_config)

        if common.sftp_paramiko(src_local, dst_remote, srcipt_package, self.node_config) == False:
            sys.exit(1)

        commandline = "tar -xvf {0}.tar".format(self.jobname, self.node_config['hostip'])
        if common.ssh_shell_paramiko(self.node_config, commandline) == False:
            self.logger.error("Failed to uncompress {0}.tar".format(self.jobname))
            sys.exit(1)

        commandline = "sudo /bin/bash {0}/kubernetes-cleanup.sh".format(self.jobname)
        if common.ssh_shell_with_password_input_paramiko(self.node_config, commandline) == False:
            self.logger.error("Failed to cleanup the kubernetes deployment on {0}".format(self.node_config['hostip']))
            sys.exit(1)

        self.logger.info("Successfully running {0} job on node {1}".format(self.jobname, self.node_config["nodename"]))



    def remote_host_cleaner(self, node_config, jobname):

        commandline = "sudo rm -rf {0}*".format(jobname)

        if common.ssh_shell_with_password_input_paramiko(node_config, commandline) == False:
            sys.exit(1)



    def job_execute_stop_etcd_on_target_node(self):

        self.logger.info("---- package wrapper is working now! ----")
        self.prepare_package(self.node_config, "stop-etcd-on-target-node")
        self.logger.info("---- package wrapper's work finished ----")

        self.logger.info("Begin to execute the job : stop-etcd-on-target-node.")
        self.logger.info("Stop the etcd server on host [{0}]".format(self.node_config['nodename']))

        script_package = "stop-etcd-on-target-node.tar"
        src_local = "parcel-center/{0}".format(self.node_config["nodename"])
        dst_remote = common.get_user_dir(self.node_config)

        if common.sftp_paramiko(src_local, dst_remote, script_package, self.node_config) == False:
            sys.exit(1)

        commandline = "tar -xvf {0}.tar && sudo /bin/bash {0}/stop-etcd-server.sh".format("stop-etcd-on-target-node")

        if common.ssh_shell_with_password_input_paramiko(self.node_config, commandline) == False:
            sys.exit(1)

        self.logger.info("Successfully stoping etcd server on node {0}".format(self.node_config["nodename"]))

        if self.clean_flag == True:
            self.logger.info("---- package cleaner is working now! ----")
            self.delete_packege(self.node_config)
            self.logger.info("---- package cleaner's work finished! ----")

            self.logger.info("---- remote host cleaner is working now! ----")
            self.remote_host_cleaner(self.node_config, "stop-etcd-on-target-node")
            self.logger.info("---- remote host cleaning job finished! ")



    def job_execute_remove_node_from_etcd_cluster(self):

        # Waiting for the bad node to remove from leader.
        while True:

            leader_node_config = pai_common.get_etcd_leader_node(self.cluster_config)

            if leader_node_config == None:
                self.logger.error("Failed to find the leader node in the etcd cluster")
                sys.exit(1)

            if leader_node_config['nodename'] != self.node_config['nodename']:
                break

        self.prepare_package(leader_node_config, "remove-node-from-etcd-cluster")

        self.logger.info("Begin to execute the job : remove-node-from-etcd-cluster.")
        self.logger.info("Update etcd cluster on host [{0}].".format(leader_node_config['nodename']))

        script_package = "remove-node-from-etcd-cluster.tar"
        src_local = "parcel-center/{0}".format(leader_node_config["nodename"])
        dst_remote = common.get_user_dir(leader_node_config)

        if common.sftp_paramiko(src_local, dst_remote, script_package, leader_node_config) == False:
            sys.exit(1)

        commandline = "tar -xvf {0}.tar".format("remove-node-from-etcd-cluster")
        if common.ssh_shell_with_password_input_paramiko(leader_node_config, commandline) == False:
            sys.exit(1)

        commandline = "sudo /bin/bash {0}/{1}.sh {2} {3}".format("remove-node-from-etcd-cluster",
                                                                 "remove-member-from-etcd-cluster",
                                                                 self.node_config['hostip'],
                                                                 self.node_config['etcdid'])
        if common.ssh_shell_with_password_input_paramiko(leader_node_config, commandline) == False:
            sys.exit(1)

        self.logger.info("Successfully remove target node from etcd cluster on node {0}".format(leader_node_config["nodename"]))

        if self.clean_flag == True:
            self.logger.info("---- package cleaner is working now! ----")
            self.delete_packege(leader_node_config)
            self.logger.info("---- package cleaner's work finished! ----")

            self.logger.info("---- remote host cleaner is working now! ----")
            self.remote_host_cleaner(leader_node_config, "remove-node-from-etcd-cluster")
            self.logger.info("---- remote host cleaning job finished! ")


    def run(self):

        if self.node_config['k8s-role'] == 'master':
            self.logger.info("The target node is master node.")

            self.logger.info("Task one before cleanup the node: stop target node's etcd.")
            self.job_execute_stop_etcd_on_target_node()

            self.logger.info("Task two before cleanup the node: remove target node from etcd cluster")
            self.job_execute_remove_node_from_etcd_cluster()


        self.logger.info("---- package wrapper is working now! ----")
        self.prepare_package(self.node_config, self.jobname)
        self.logger.info("---- package wrapper's work finished ----")

        self.job_executer_clean_up_node()

        if self.clean_flag == True:
            self.logger.info("---- package cleaner is working now! ----")
            self.delete_packege(self.node_config)
            self.logger.info("---- package cleaner's work finished! ----")

            self.logger.info("---- remote host cleaner is working now! ----")
            self.remote_host_cleaner(self.node_config, self.jobname)
            self.logger.info("---- remote host cleaning job finished! ")

