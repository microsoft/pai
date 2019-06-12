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


import os
import sys
import time
import readline
import logging
import logging.config

from k8sPaiLibrary.maintainlib import add as k8s_add
from k8sPaiLibrary.maintainlib import remove as k8s_remove
from k8sPaiLibrary.maintainlib import etcdfix as k8s_etcd_fix
from k8sPaiLibrary.maintainlib import kubectl_conf_check
from k8sPaiLibrary.maintainlib import kubectl_install
from k8sPaiLibrary.maintainlib import update as k8s_update


from paiLibrary.common import file_handler
from clusterObjectModel.cluster_object_model import cluster_object_model

logger = logging.getLogger(__name__)

# True : continue
# False: exit
def kubectl_env_checking(cluster_object_mode):

    kubectl_conf_ck_worker = kubectl_conf_check.kubectl_conf_check(cluster_object_mode)
    if kubectl_conf_ck_worker.check() == False:
        count_input = 0

        while True:
            user_input = raw_input("Do you want to re-install kubectl by paictl? (Y/N) ")

            if user_input == "N":
                count_quit = 0
                while True:
                    quit_or_not = raw_input("Do you want to quit by this operation? (Y/N) ")
                    if quit_or_not == "Y":
                        return False
                    elif quit_or_not == "N":
                        return True
                    else:
                        print(" Please type Y or N.")
                    count_quit = count_quit + 1
                    if count_quit == 3:
                        logger.warning("3 Times.........  Sorry,  we will force stopping your operation.")
                        return False

            elif user_input == "Y":
                kubectl_install_worker = kubectl_install.kubectl_install(cluster_object_mode)
                kubectl_install_worker.run()
                return True

            else:
                print(" Please type Y or N.")

            count_input = count_input + 1
            if count_input == 3:
                logger.warning("3 Times.........  Sorry,  we will force stopping your operation.")
                return False
    return True


class MachineCmd():
    def register(self, parser):
        machine_parser = parser.add_subparsers(help="machine operations")

        # ./paictl.py machine add ...
        add_parser = machine_parser.add_parser("add")
        add_parser.set_defaults(handler=self.machine_add)

        # ./paictl.py machine remove ...
        remove_parser = machine_parser.add_parser("remove")
        remove_parser.set_defaults(handler=self.machine_remove)

        # ./paictl.py machine etcd-fix ...
        etcd_parser = machine_parser.add_parser("etcd-fix")
        etcd_parser.set_defaults(handler=self.etcd_fix)

        # ./paictl.py machine update ...
        #update_parser = machine_parser.add_parser("update")
        #update_parser.add_argument("-p", "--config-path", dest="config_path", default=None, help="the path of directory which stores the cluster configuration.")
        #update_parser.add_argument("-c", "--kube-config-path", dest="kube_config_path", default="~/.kube/config", help="The path to KUBE_CONFIG file. Default value: ~/.kube/config")
        #update_parser.set_defaults(handler=self.machine_update)

        def add_arguments(parser):
            parser.add_argument("-p", "--config-path", dest="config_path", required=True, help="The path of your configuration directory.")
            parser.add_argument("-l", "--node-list", dest="node_list", required=True, help="The node-list to be operator")

        add_arguments(add_parser)
        add_arguments(remove_parser)
        add_arguments(etcd_parser)

    def process_args(self, args):
        cluster_object_model_instance = cluster_object_model(args.config_path)
        com = cluster_object_model_instance.kubernetes_config()
        node_list = file_handler.load_yaml_config(args.node_list)

        if not kubectl_env_checking(com):
            raise RuntimeError("failed to do kubectl checking")

        for host in node_list["machine-list"]:
            if "nodename" not in host:
                host["nodename"] = host["hostip"]

        return com, node_list

    def machine_add(self, args):
        cluster_object_model_k8s, node_list = self.process_args(args)

        for host in node_list["machine-list"]:
            add_worker = k8s_add.add(cluster_object_model_k8s, host, True)
            add_worker.run()

            if host["k8s-role"] == "master":
                logger.info("Master Node is added, sleep 60s to wait it ready.")
                time.sleep(60)

    def machine_remove(self, args):
        cluster_object_model_k8s, node_list = self.process_args(args)

        for host in node_list["machine-list"]:
            add_worker = k8s_remove.remove(cluster_object_model_k8s, host, True)
            add_worker.run()

            if host["k8s-role"] == "master":
                logger.info("master node is removed, sleep 60s for etcd cluster's updating")
                time.sleep(60)

    def machine_update(self, args):
        if args.kube_config_path != None:
            args.kube_config_path = os.path.expanduser(args.kube_config_path)

        update_worker = k8s_update.update(kube_config_path=args.kube_config_path)
        update_worker.run()
        logger.info("Congratulations! Machine update is finished.")

    def etcd_fix(self, args):
        cluster_object_model_k8s, node_list = self.process_args(args)

        if len(node_list["machine-list"]) > 1:
            logger.error("etcd-fix can't fix more than one machine everytime. Please fix them one by one!")
            sys.exit(1)

        for host in node_list["machine-list"]:
            etcd_fix_worker = k8s_etcd_fix.etcdfix(cluster_object_model_k8s, host, True)
            etcd_fix_worker.run()

        logger.info("Etcd has been fixed.")
