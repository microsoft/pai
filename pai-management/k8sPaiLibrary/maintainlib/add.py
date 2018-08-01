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

package_directory_add = os.path.dirname(os.path.abspath(__file__))


class add:

    """
    An class to add new node
    """

    def __init__(self, cluster_config, node_config, clean):

        self.logger = logging.getLogger(__name__)

        self.cluster_config = cluster_config
        self.node_config = node_config
        maintain_configuration_path = os.path.join(package_directory_add, "../maintainconf/add.yaml")
        self.maintain_config = common.load_yaml_file(maintain_configuration_path)
        self.clean_flag = clean

        if node_config['k8s-role'] == 'worker':
            self.jobname = "add-worker-node"
        elif node_config['k8s-role'] == 'master':
            self.jobname = "add-master-node"
        else:
            self.jobname = "error"
            self.logger.error("[{0}] Error: {1} is an undefined role, quit add job in host [{2}]".format(time.asctime(), node_config['k8s-role'], node_config['nodename']))
            sys.exit(1)



    def prepare_package(self, node_config, job_name):

        common.maintain_package_wrapper(self.cluster_config, self.maintain_config, node_config, job_name)



    def delete_packege(self, node_config):

        common.maintain_package_cleaner(node_config)



    def job_executer_add_work_node(self):

        self.logger.info("{0} job begins !".format(self.jobname))

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

        commandline = "sudo ./{0}/hosts-check.sh {1}".format(self.jobname, self.node_config['hostip'])
        if common.ssh_shell_with_password_input_paramiko(self.node_config, commandline) == False:
            self.logger.error("Failed to update the /etc/hosts on {0}".format(self.node_config['hostip']))
            sys.exit(1)

        commandline = "sudo ./{0}/docker-ce-install.sh {0}".format(self.jobname)
        if common.ssh_shell_with_password_input_paramiko(self.node_config, commandline) == False:
            self.logger.error("Failed to install docker-ce on {0}".format(self.node_config['hostip']))
            sys.exit(1)

        commandline = "sudo ./{0}/kubelet-start.sh {0}".format(self.jobname)
        if common.ssh_shell_with_password_input_paramiko(self.node_config, commandline) == False:
            self.logger.error("Failed to bootstrap kubelet on {0}".format(self.node_config['hostip']))
            sys.exit(1)

        self.logger.info("Successfully running {0} job on node {1}".format(self.jobname, self.node_config["nodename"]))



    def remote_host_cleaner(self, node_config, jobname):

        commandline = "sudo rm -rf {0}*".format(jobname)

        if common.ssh_shell_with_password_input_paramiko(node_config, commandline) == False:
            sys.exit(1)



    def run_add_work_node(self):

        self.logger.info("---- package wrapper is working now! ----")
        self.prepare_package(self.node_config, "add-worker-node")
        self.logger.info("---- package wrapper's work finished ----")

        self.job_executer_add_work_node()

        if self.clean_flag == True:
            self.logger.info("---- package cleaner is working now! ----")
            self.delete_packege(self.node_config)
            self.logger.info("---- package cleaner's work finished! ----")

            self.logger.info("---- remote host cleaner is working now! ----")
            self.remote_host_cleaner(self.node_config, self.jobname)
            self.logger.info("---- remote host cleaning job finished! ")



    def job_executer_add_node_to_etcd_cluster(self):

        self.logger.info("Find a alive etcd node in the cluster")

        # Directly find the leader node.
        good_node_config = pai_common.get_etcd_leader_node(self.cluster_config)
        if good_node_config == None:
            self.logger.error("Unable to find the etcd leader node.")
            sys.exit(1)

        self.logger.info("------------ package wrapper is working now ! -------------------- ")
        self.prepare_package(good_node_config, "add-master-node-task-one")
        self.logger.info("------------ package wrapper's work finished ! ------------------- ")

        script_package = "add-master-node-task-one.tar"
        src_local = "parcel-center/{0}".format(good_node_config["nodename"])
        dst_remote = common.get_user_dir(good_node_config)

        if common.sftp_paramiko(src_local, dst_remote, script_package, good_node_config) == False:
            sys.exit(1)

        commandline = "tar -xvf {0}".format(script_package)
        if common.ssh_shell_with_password_input_paramiko(good_node_config, commandline) == False:
            sys.exit(1)
        self.logger.info("Successfully extract the script package for add-master-node-task-one!")

        commandline = "sudo /bin/bash {0}/{1}.sh {2} {3}".format("add-master-node-task-one",
                                                                 "add-member-to-etcd-cluster",
                                                                 self.node_config['hostip'],
                                                                 self.node_config['etcdid'])
        if common.ssh_shell_with_password_input_paramiko(good_node_config, commandline) == False:
            sys.exit(1)
        self.logger.info("Successfully add the new master into the etcd cluster.")

        if self.clean_flag:
            self.delete_packege(good_node_config)
            self.remote_host_cleaner(good_node_config, "add-master-node-task-one")



    def job_executer_starting_new_master_node(self):

        new_etcd_cluster_ips_peer = pai_common.get_new_etcd_peer_ip_list(self.cluster_config, self.node_config)
        self.cluster_config['clusterinfo']['etcd_cluster_ips_peer'] = new_etcd_cluster_ips_peer
        self.cluster_config['clusterinfo']['etcd-initial-cluster-state'] = 'existing'

        self.logger.info("---- package wrapper is working now! ----")
        self.prepare_package(self.node_config, "add-master-node-task-two")
        self.logger.info("---- package wrapper's work finished ----")

        script_package = "add-master-node-task-two.tar"
        src_local = "parcel-center/{0}".format(self.node_config["nodename"])
        dst_remote = common.get_user_dir(self.node_config)

        if common.sftp_paramiko(src_local, dst_remote, script_package, self.node_config) == False:
            sys.exit(1)

        commandline = "tar -xvf {0}".format(script_package)
        if common.ssh_shell_with_password_input_paramiko(self.node_config, commandline) == False:
            sys.exit(1)
        self.logger.info("Successfully extract the script package for add-master-node-task-two!")

        commandline = "sudo ./{0}/hosts-check.sh {1}".format("add-master-node-task-two", self.node_config['hostip'])
        if common.ssh_shell_with_password_input_paramiko(self.node_config, commandline) == False:
            self.logger.error("Failed to update the /etc/hosts on {0}".format(self.node_config['hostip']))
            sys.exit(1)

        commandline = "sudo ./{0}/docker-ce-install.sh {0}".format("add-master-node-task-two")
        if common.ssh_shell_with_password_input_paramiko(self.node_config, commandline) == False:
            self.logger.error("Failed to install docker-ce on {0}".format(self.node_config['hostip']))
            sys.exit(1)

        commandline = "sudo ./{0}/kubelet-start.sh {0}".format("add-master-node-task-two")
        if common.ssh_shell_with_password_input_paramiko(self.node_config, commandline) == False:
            self.logger.error("Failed to bootstrap kubelet on {0}".format(self.node_config['hostip']))
            sys.exit(1)

        self.logger.info("Successfully running {0} job on node {1}!".format("add-master-node-task-two", self.node_config['hostip']))

        if self.clean_flag:
            self.delete_packege(self.node_config)
            self.remote_host_cleaner(self.node_config, "add-master-node-task-two")


    def run_add_master_node(self):

        self.logger.info("Begin to add master node into kubernetes cluster.")
        self.logger.info("TASK 1: ---- Begin to add the target node to the etcd cluster ---- ")
        self.job_executer_add_node_to_etcd_cluster()

        self.logger.info("TASK 2: ---- Begin to new master node into your k8s cluster ------ ")
        self.job_executer_starting_new_master_node()





    def run(self):

        if self.jobname == "add-worker-node":
            self.run_add_work_node()

        if self.jobname == "add-master-node":
            self.run_add_master_node()