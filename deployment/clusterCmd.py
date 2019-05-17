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
from k8sPaiLibrary.maintainlib import k8s_util

from clusterObjectModel.cluster_object_model import cluster_object_model

logger = logging.getLogger(__name__)


class ClusterCmd():
    def register(self, parser):
        cluster_parser = parser.add_subparsers(help="cluster operations")

        # ./paictl.py cluster k8s-bootup ...
        bootup_parser = cluster_parser.add_parser("k8s-bootup")
        bootup_parser.add_argument("-p", "--config-path", dest="config_path", required=True, help="path of cluster configuration file")
        bootup_parser.set_defaults(handler=self.k8s_bootup)

        # ./paictl.py cluster k8s-clean ...
        clean_parser = cluster_parser.add_parser("k8s-clean")
        clean_parser.add_argument("-p", "--config-path", dest="config_path", required=True, help="path of cluster configuration file")
        clean_parser.add_argument("-f", "--force", dest="force", required=False, action="store_true", help="clean all the data forcefully")
        clean_parser.set_defaults(handler=self.k8s_clean)

        # ./paictl.py cluster k8s-set-env ...
        env_parser = cluster_parser.add_parser("k8s-set-env")
        env_parser.add_argument("-p", "--config-path", dest="config_path", help="path of cluster configuration file")
        env_parser.set_defaults(handler=self.k8s_set_environment)

    def k8s_bootup(self, args):
        cluster_object_model_instance = cluster_object_model(args.config_path)
        com = cluster_object_model_instance.kubernetes_config()
        logger.info("Begin to initialize PAI k8s cluster.")
        k8s_util.maintain_cluster_k8s(com, option_name="deploy", clean=True)
        logger.info("Finish initializing PAI k8s cluster.")

    def k8s_clean(self, args):
        # just use 'k8s-clean' for testing temporarily.
        cluster_object_model_instance = cluster_object_model(args.config_path)
        com = cluster_object_model_instance.kubernetes_config()
        logger.warning("--------------------------------------------------------")
        logger.warning("--------------------------------------------------------")
        logger.warning("----------     Dangerous Operation!!!    ---------------")
        logger.warning("------     Your k8s Cluster will be destroyed    -------")
        logger.warning("------     PAI service on k8s will be stopped    -------")
        logger.warning("--------------------------------------------------------")
        if args.force:
            logger.warning("--------------------------------------------------------")
            logger.warning("----------    ETCD data will be cleaned.    ------------")
            logger.warning("-----    If you wanna keep pai's user data.    ---------")
            logger.warning("-----         Please backup etcd data.         ---------")
            logger.warning("-----      And restore it after k8s-bootup     ---------")
            logger.warning("---     And restore it before deploy pai service    ----")
            logger.warning("--------------------------------------------------------")
        logger.warning("--------------------------------------------------------")
        logger.warning("----    Please ensure you wanna do this operator, ------")
        logger.warning("-------        after knowing all risk above.     -------")
        logger.warning("--------------------------------------------------------")
        logger.warning("--------------------------------------------------------")

        count_input = 0

        while True:
            user_input = raw_input("Do you want to continue this operation? (Y/N) ")
            if user_input == "N":
                return
            elif user_input == "Y":
                break
            else:
                print(" Please type Y or N.")
            count_input = count_input + 1
            if count_input == 3:
                logger.warning("3 Times.........  Sorry,  we will force stopping your operation.")
                return

        logger.info("Begin to clean up whole cluster.")
        k8s_util.maintain_cluster_k8s(com, option_name="clean", force=args.force, clean=True)
        logger.info("Clean up job finished")

    def k8s_set_environment(self, args):
        if args.config_path != None:
            args.config_path = os.path.expanduser(args.config_path)
            cluster_object_model_instance = cluster_object_model(args.config_path)
            com = cluster_object_model_instance.kubernetes_config()
        else:
            com = None
        kubectl_install_worker = kubectl_install.kubectl_install(com)
        kubectl_install_worker.run()
