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
import kubernetes
import etcd
import common



class etcdFix:

    """
    A class to reconfiguration etcd. Fix the issue when etcd's data is corrupted
    """

    def __init__(self, cluster_config, node_config, clean):

        self.cluster_config = cluster_config
        self.bad_node_config = node_config
        self.maintain_config = common.load_yaml_file("maintainconf/etcd-reconfiguration.yaml")
        self.clean_flag = clean



    def prepare_package(self, node_config, jobname):

        common.maintain_package_wrapper(self.cluster_config, self.maintain_config, node_config, jobname)



    def delete_packege(self, node_config):

        common.maintain_package_cleaner(node_config)



    def stop_bad_etcd_server(self, bad_node_config):

        self.prepare_package(bad_node_config, "stop-etcd-server")

        print "Stop the bad etcd server on host [{0}]".format(bad_node_config['nodename'])

        script_package = "stop-etcd-server.tar"
        src_local = "parcel-center/{0}".format(bad_node_config["nodename"])
        dst_remote = "/home/{0}".format(bad_node_config["username"])

        if common.sftp_paramiko(src_local, dst_remote, script_package, bad_node_config) == False:
            return

        commandline = "tar -xvf stop-etcd-server.tar && sudo ./stop-etcd-server/stop-etcd-server.sh"

        if common.ssh_shell_paramiko(bad_node_config, commandline) == False:
            return

        print "Successfully stoping bad etcd server on node {0}".format(bad_node_config["nodename"])

        if self.clean_flag:
            self.delete_packege(bad_node_config)



    def update_etcd_cluster(self, good_node_config):

        self.prepare_package(good_node_config, "update-etcd-cluster")

        print "Update etcd cluster on host [{0}]".format(good_node_config['nodename'])

        script_package = "update-etcd-cluster.tar"
        src_local = "parcel-center/{0}".format(good_node_config["nodename"])
        dst_remote = "/home/{0}".format(good_node_config["username"])

        if common.sftp_paramiko(src_local, dst_remote, script_package, good_node_config) == False:
            return

        commandline = "tar -xvf update-etcd-cluster.tar && sudo ./update-etcd-cluster/update-etcd-cluster.sh"

        if common.ssh_shell_paramiko(good_node_config, commandline) == False:
            return

        print "Successfully stoping bad etcd server on node {0}".format(good_node_config["nodename"])

        if self.clean_flag:
            self.delete_packege(good_node_config)



    def restart_etcd_server(self, bad_node_config):

        self.prepare_package(bad_node_config, "restart_etcd_server")

        new_etcd_cluster_ips_peer = self.get_etcd_peer_ip_list()

        self.cluster_config['clusterinfo']['etcd_cluster_ips_peer'] = new_etcd_cluster_ips_peer
        self.cluster_config['clusterinfo']['etcd-initial-cluster-state'] = 'existing'

        print "Restart etcd server on host [{0}]".format(bad_node_config['nodename'])

        script_package = "etcd-reconfiguration-restart.tar"
        src_local = "parcel-center/{0}".format(bad_node_config["nodename"])
        dst_remote = "/home/{0}".format(bad_node_config["username"])

        if common.sftp_paramiko(src_local, dst_remote, script_package, bad_node_config) == False:
            return

        commandline = "tar -xvf {0}.tar && sudo ./{0}/{0}.sh".format("etcd-reconfiguration-restart")

        if common.ssh_shell_paramiko(bad_node_config, commandline) == False:
            return

        print "Successfully restarting bad etcd server on node {0}".format(bad_node_config["nodename"])

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
                return self.cluster_config['mastermachinelist'][host]

        return None



    def get_etcd_peer_ip_list(self):

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

            ip_peer = "{0}={1}".format(etcd_id, peer_url)

            etcd_cluster_ips_peer = etcd_cluster_ips_peer + separated + ip_peer

            separated = ","


        return etcd_cluster_ips_peer



    def run(self):

        bad_node_config = self.bad_node_config
        good_node_config = self.get_etcd_leader_node()

        self.restart_etcd_server(bad_node_config)

        self.update_etcd_cluster(good_node_config)

        self.restart_etcd_server(bad_node_config)