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
import etcd
import common
import logging
import logging.config


class etcdfix_conf_validation:

    """
    A class to validation the cluster configuration.
    """

    def __init__(self, cluster_config, node_config):

        self.logger = logging.getLogger(__name__)

        self.cluster_config = cluster_config
        self.node_config = node_config



    def node_conf_validation(self, node_cfg = None):

        if node_cfg == None:
            node_cfg = self.node_config

        if 'nodename' not in node_cfg:

            self.logger.error("nodename not in your node configuration.")

            return False

        if 'hostip' not in node_cfg:

            self.logger.error("hostip not in your node configuration.")

            return False

        if common.ipv4_address_validation(node_cfg['hostip']) == False:

            self.logger.error("The hostip in configuration is invalid.")

            return False

        if 'sshport' in node_cfg and common.port_validation(node_cfg['sshport']) == False:

            self.logger.error("The sshport in configuration is in valid.")

            return False

        if 'username' not in node_cfg:

            self.logger.error("username not in your node configuration.")

            return False

        if 'password' not in node_cfg:

            self.logger.error("password not in your node configuration.")

            return False

        if 'etcdid' not in node_cfg:

            self.logger.error("etcdid not in your node configuration.")

            return False

        return True



    def cluster_conf_validation(self):

        if 'mastermachinelist' not in self.cluster_config:

            self.logger.error("mastermachinelist not in your cluster configuration.")

            return False

        ret = False

        for host in self.cluster_config['mastermachinelist']:

            hostObject = self.cluster_config['mastermachinelist'][host]

            if self.node_conf_validation(hostObject) == False:

                return False

            if str(hostObject['nodename']) == str(self.node_config['nodename']):

                if str(hostObject['hostip']) != str(self.node_config['hostip']):

                    self.logger.error("Hostip of the bad node in cluster configuration is inconsistent with node configuration")
                    return False

                if str(hostObject['username']) != str(self.node_config['username']):

                    self.logger.error("username of the bad node in cluster configuration is inconsistent with node configuration")
                    return False

                if str(hostObject['password']) != str(self.node_config['password']):

                    self.logger.error("password of the bad node in cluster configuration is inconsistent with node configuration")
                    return False

                if 'sshport' not in hostObject:

                    hostObject['sshport'] = 22

                if 'sshport' not in self.node_config:

                    self.node_config['sshport'] = 22

                if str(hostObject['sshport']) != str(self.node_config['sshport']):

                    self.logger.error(
                        "sshport of the bad node in cluster configuration is inconsistent with node configuration")
                    return False

                if str(hostObject['etcdid']) != str(self.node_config['etcdid']):

                    self.logger.error(
                        "etcdid of the bad node in cluster configuration is inconsistent with node configuration")
                    return False

                ret = True


        if ret == False:

            self.logger.error("Bad node not in your cluster configuration.")

        return ret



    def validation(self):

        return self.node_conf_validation() and self.cluster_conf_validation()



class etcdfix:

    """
    A class to reconfiguration etcd. Fix the issue when etcd's data is corrupted
    """

    def __init__(self, cluster_config, node_config, clean):

        self.logger = logging.getLogger(__name__)

        self.logger.info("Initialize class etcdfix to fix the broken etcd member on {0}".format(node_config["nodename"]))
        self.logger.debug("Node-configuration: {0}".format(str(node_config)))

        self.cluster_config = cluster_config
        self.bad_node_config = node_config
        self.maintain_config = common.load_yaml_file("k8sPaiLibrary/maintainconf/etcdfix.yaml")
        self.clean_flag = clean



    def prepare_package(self, node_config, jobname):

        self.logger.debug("Prepare package for {0} on {1}".format(jobname, node_config['nodename']))
        self.logger.debug("The job configuration: {0}".format(self.maintain_config[jobname]))

        common.maintain_package_wrapper(self.cluster_config, self.maintain_config, node_config, jobname)



    def delete_packege(self, node_config):

        self.logger.debug("Cleanup all package of {0} on the package on directory ".format(node_config['nodename']))

        common.maintain_package_cleaner(node_config)



    def stop_bad_etcd_server(self, bad_node_config):

        self.prepare_package(bad_node_config, "etcd-reconfiguration-stop")

        self.logger.info("Begin to execute the job : etcd-reconfiguration-stop.")
        self.logger.info("Stop the bad etcd server on host [{0}]".format(bad_node_config['nodename']))

        script_package = "etcd-reconfiguration-stop.tar"
        src_local = "parcel-center/{0}".format(bad_node_config["nodename"])
        dst_remote = "/home/{0}".format(bad_node_config["username"])

        if common.sftp_paramiko(src_local, dst_remote, script_package, bad_node_config) == False:
            return

        commandline = "tar -xvf {0}.tar && sudo ./{0}/stop-etcd-server.sh".format("etcd-reconfiguration-stop")

        if common.ssh_shell_paramiko(bad_node_config, commandline) == False:
            return

        self.logger.info("Successfully stoping bad etcd server on node {0}".format(bad_node_config["nodename"]))

        if self.clean_flag:
            self.delete_packege(bad_node_config)



    def update_etcd_cluster(self, good_node_config, bad_node_config):

        self.prepare_package(good_node_config, "etcd-reconfiguration-update")

        self.logger.info("Begin to execute the job : etcd-reconfiguration-update.")
        self.logger.info("Update etcd cluster on host [{0}].".format(good_node_config['nodename']))

        script_package = "etcd-reconfiguration-update.tar"
        src_local = "parcel-center/{0}".format(good_node_config["nodename"])
        dst_remote = "/home/{0}".format(good_node_config["username"])

        if common.sftp_paramiko(src_local, dst_remote, script_package, good_node_config) == False:
            return

        commandline = "tar -xvf {0}.tar && sudo ./{0}/{1}.sh {2} {3}".format("etcd-reconfiguration-update", "update-etcd-cluster", bad_node_config['hostip'], bad_node_config['etcdid'] )

        if common.ssh_shell_paramiko(good_node_config, commandline) == False:
            return

        self.logger.info("Successfully update etcd cluster configuration on node {0}".format(bad_node_config["nodename"]))

        if self.clean_flag:
            self.delete_packege(good_node_config)



    def restart_etcd_server(self, bad_node_config):

        self.logger.info("Begin to execute the job : etcd-reconfiguration-restart.")
        self.logger.info("Restart etcd server on host [{0}].".format(bad_node_config['nodename']))

        new_etcd_cluster_ips_peer = self.get_etcd_peer_ip_list(bad_node_config)

        self.cluster_config['clusterinfo']['etcd_cluster_ips_peer'] = new_etcd_cluster_ips_peer
        self.cluster_config['clusterinfo']['etcd-initial-cluster-state'] = 'existing'

        self.prepare_package(bad_node_config, "etcd-reconfiguration-restart")

        script_package = "etcd-reconfiguration-restart.tar"
        src_local = "parcel-center/{0}".format(bad_node_config["nodename"])
        dst_remote = "/home/{0}".format(bad_node_config["username"])

        if common.sftp_paramiko(src_local, dst_remote, script_package, bad_node_config) == False:
            return

        commandline = "tar -xvf {0}.tar && sudo ./{0}/{1}.sh".format("etcd-reconfiguration-restart", "restart-etcd-server")

        if common.ssh_shell_paramiko(bad_node_config, commandline) == False:
            return

        self.logger.info("Successfully restarting bad etcd server on node {0}".format(bad_node_config["nodename"]))

        if self.clean_flag:
            self.delete_packege(bad_node_config)



    def get_etcd_leader_node(self):

        # Get leader node.
        host_list = list()

        for host in self.cluster_config['mastermachinelist']:
            host_list.append((self.cluster_config['mastermachinelist'][host]['hostip'], 4001))

        client = etcd.Client(host=tuple(host_list), allow_reconnect=True)

        etcdid = client.leader['name']

        for host in self.cluster_config['mastermachinelist']:
            if etcdid == self.cluster_config['mastermachinelist'][host]['etcdid']:
                self.logger.debug("Current leader of etcd-cluster: {0}".format(self.cluster_config['mastermachinelist'][host]))
                return self.cluster_config['mastermachinelist'][host]

        self.logger.error("Can't find the leader of etcd.")
        return None



    def get_etcd_peer_ip_list(self, bad_node_config):

        etcd_cluster_ips_peer = ""
        separated = ""

        host_list = list()

        for host in self.cluster_config['mastermachinelist']:
            host_list.append((self.cluster_config['mastermachinelist'][host]['hostip'], 4001))

        client = etcd.Client(host=tuple(host_list), allow_reconnect=True)

        member_dict = client.members
        for member_hash in member_dict:

            etcd_id = member_dict[member_hash]['name']
            peer_url = member_dict[member_hash]['peerURLs'][0]

            if etcd_id == "":
                # new member before announcing, etcdid will be empty.
                continue

            ip_peer = "{0}={1}".format(etcd_id, peer_url)

            etcd_cluster_ips_peer = etcd_cluster_ips_peer + separated + ip_peer

            separated = ","

        new_etcd_id = bad_node_config['etcdid']
        peer_url = bad_node_config['hostip']
        ip_peer = "{0}=http://{1}:2380".format(new_etcd_id, peer_url)
        etcd_cluster_ips_peer = etcd_cluster_ips_peer + separated + ip_peer

        self.logger.debug("New etcd-initial-cluster: {0}".format(etcd_cluster_ips_peer))

        return etcd_cluster_ips_peer



    def run(self):

        validation = etcdfix_conf_validation(self.cluster_config, self.bad_node_config)

        if validation.validation() == False:
            return False

        self.logger.info("Begin to fix etcd-cluster's bad member!")

        bad_node_config = self.bad_node_config

        self.logger.debug("Bad node information: {0}".format(str(bad_node_config)))

        self.stop_bad_etcd_server(bad_node_config)

        # Waiting for the bad node to demote from leader.
        while True:

            good_node_config = self.get_etcd_leader_node()

            if good_node_config == None:

                return False

            if good_node_config['nodename'] != self.bad_node_config['nodename']:

                break

        self.logger.debug("Good node information: {0}".format(str(good_node_config)))

        self.update_etcd_cluster(good_node_config, bad_node_config)

        self.restart_etcd_server(bad_node_config)

        return True