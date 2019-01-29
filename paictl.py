#!/usr/bin/env python

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

from __future__ import print_function

import time
import os
import sys
import argparse
import logging
import logging.config

from deployment.confStorage.download import  download_configuration
from deployment.confStorage.synchronization import synchronization
from deployment.confStorage.external_version_control.external_config import uploading_external_config
from deployment.confStorage.get_cluster_id import get_cluster_id

from deployment.paiLibrary.common import linux_shell
from deployment.paiLibrary.common import file_handler
from deployment.paiLibrary.clusterObjectModel import objectModelFactory
from deployment.paiLibrary.paiService import service_management_start
from deployment.paiLibrary.paiService import service_management_stop
from deployment.paiLibrary.paiService import service_management_delete
from deployment.paiLibrary.paiService import service_management_refresh
from deployment.paiLibrary.paiCluster import cluster_util

from deployment.k8sPaiLibrary.maintainlib import add as k8s_add
from deployment.k8sPaiLibrary.maintainlib import remove as k8s_remove
from deployment.k8sPaiLibrary.maintainlib import etcdfix as k8s_etcd_fix
from deployment.k8sPaiLibrary.maintainlib import kubectl_conf_check
from deployment.k8sPaiLibrary.maintainlib import kubectl_install
from deployment.k8sPaiLibrary.maintainlib import update as k8s_update

from deployment.clusterObjectModel.cluster_object_model import cluster_object_model

from deployment.utility.ssh import OpenPaiSSH
from deployment.utility.sftp_copy import OpenPaiSftpCopy


logger = logging.getLogger(__name__)


def setup_logging():
    """
    Setup logging configuration.
    """
    configuration_path = "deployment/sysconf/logging.yaml"
    logging_configuration = file_handler.load_yaml_config(configuration_path)
    logging.config.dictConfig(logging_configuration)


#########
## TODO: Please remove all function following, after cluster_object_model is finsied.


def load_cluster_objectModel_service(config_path):

    objectModel = objectModelFactory.objectModelFactory(config_path)
    ret = objectModel.objectModelPipeLine()

    return ret["service"]


def load_cluster_objectModel_k8s(config_path):

    objectModel = objectModelFactory.objectModelFactory(config_path)
    ret = objectModel.objectModelPipeLine()
    return ret["k8s"]


def cluster_object_model_generate_service(config_path):

    cluster_config = load_cluster_objectModel_service(config_path)
    return cluster_config


def cluster_object_model_generate_k8s(config_path):

    cluster_config = load_cluster_objectModel_k8s(config_path)
    return cluster_config


## TODO: Please remove all function above, after cluster_object_model is finsied.
#########

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


class SubCmd(object):
    """ interface class for defining sub-command for paictl """

    def register(self, parser):
        """ subclass use this method to register arguments """
        pass

    @staticmethod
    def add_handler(parser, handler, *args, **kwargs):
        """ helper function for adding sub-command handler """
        sub_parser = parser.add_parser(*args, **kwargs)
        sub_parser.set_defaults(handler=handler)  # let handler handle this subcmd
        return sub_parser

    def run(self, args):
        """ will call run with expected args, subclass do not have to override this method
        if subclass use `add_handler` to register handler. """
        args.handler(args)


class Machine(SubCmd):
    def register(self, parser):
        machine_parser = parser.add_subparsers(help="machine operations")

        def add_arguments(parser):
            parser.add_argument("-p", "--config-path", dest="config_path", required=True,
                    help="The path of your configuration directory.")
            parser.add_argument("-l", "--node-list", dest="node_list", required=True,
                    help="The node-list to be operator")

        add_parser = SubCmd.add_handler(machine_parser, self.machine_add, "add")
        remove_parser = SubCmd.add_handler(machine_parser, self.machine_remove, "remove")
        etcd_parser = SubCmd.add_handler(machine_parser, self.etcd_fix, "etcd-fix")
        update_parser = SubCmd.add_handler(machine_parser, self.machine_update, "update")

        add_arguments(add_parser)
        add_arguments(remove_parser)
        add_arguments(etcd_parser)

        update_parser.add_argument("-p", "--config-path", dest="config_path", default=None,
                                   help="the path of directory which stores the cluster configuration.")
        update_parser.add_argument("-c", "--kube-config-path", dest="kube_config_path", default="~/.kube/config",
                                   help="The path to KUBE_CONFIG file. Default value: ~/.kube/config")

    def process_args(self, args):
        cluster_object_model_instance = cluster_object_model(args.config_path)
        com = cluster_object_model_instance.run()
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

        update_worker = k8s_update.update(kube_config_path = args.kube_config_path)
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


class Service(SubCmd):
    def register(self, parser):
        service_parser = parser.add_subparsers(help="service operations")

        def add_arguments(parser):
            parser.add_argument("-c", "--kube-config-path", dest="kube_config_path", default="~/.kube/config",
                                help="The path to KUBE_CONFIG file. Default value: ~/.kube/config")
            parser.add_argument("-n", "--service-name", dest="service_name", default="all",
                                help="Build and push the target image to the registry")

        start_parser = SubCmd.add_handler(service_parser, self.service_start, "start")
        stop_parser = SubCmd.add_handler(service_parser, self.service_stop, "stop")
        delete_parser = SubCmd.add_handler(service_parser, self.service_delete, "delete")
        refresh_parser = SubCmd.add_handler(service_parser, self.service_refresh, "refresh")

        add_arguments(start_parser)
        add_arguments(stop_parser)
        add_arguments(delete_parser)
        add_arguments(refresh_parser)

    def process_args(self, args):
        if args.kube_config_path != None:
            args.kube_config_path = os.path.expanduser(args.kube_config_path)

        service_list = None
        if args.service_name != "all":
            service_list = [args.service_name]

        return service_list

    def service_start(self, args):
        service_list = self.process_args(args)

        service_management_starter = service_management_start.serivce_management_start(args.kube_config_path, service_list)
        service_management_starter.run()

    def service_stop(self, args):
        service_list = self.process_args(args)

        service_management_stopper = service_management_stop.service_management_stop(args.kube_config_path, service_list)
        service_management_stopper.run()

    def service_delete(self, args):
        service_list = self.process_args(args)

        logger.warning("--------------------------------------------------------")
        logger.warning("--------------------------------------------------------")
        logger.warning("----------     Dangerous Operation!!!    ---------------")
        logger.warning("------     The target service will be stopped    -------")
        logger.warning("------    And the persistent data on the disk    -------")
        logger.warning("-------             will be deleted             --------")
        logger.warning("--------------------------------------------------------")
        logger.warning("--------------------------------------------------------")
        logger.warning("--------     It's an irreversible operation      -------")
        logger.warning("--------           After this operation,         -------")
        logger.warning("------ the deleted service data is unrecoverable -------")
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

        service_management_deleter = service_management_delete.service_management_delete(args.kube_config_path, service_list)
        service_management_deleter.run()

    def service_refresh(self, args):
        service_list = self.process_args(args)

        service_management_refresher = service_management_refresh.service_management_refresh(args.kube_config_path, service_list)
        service_management_refresher.run()


class Cluster(SubCmd):
    def register(self, parser):
        cluster_parser = parser.add_subparsers(help="cluster operations")

        bootup_parser = SubCmd.add_handler(cluster_parser, self.k8s_bootup, "k8s-bootup")
        clean_parser = SubCmd.add_handler(cluster_parser, self.k8s_clean, "k8s-clean")
        env_parser = SubCmd.add_handler(cluster_parser, self.k8s_set_environment, "k8s-set-env")

        bootup_parser.add_argument("-p", "--config-path", dest="config_path", required=True,
            help="path of cluster configuration file")

        clean_parser.add_argument("-p", "--config-path", dest="config_path", required=True, help="path of cluster configuration file")
        clean_parser.add_argument("-f", "--force", dest="force", required=False, action="store_true", help="clean all the data forcefully")

        env_parser.add_argument("-p", "--config-path", dest="config_path", help="path of cluster configuration file")

    def k8s_bootup(self, args):
        cluster_object_model_instance = cluster_object_model(args.config_path)
        com = cluster_object_model_instance.run()
        logger.info("Begin to initialize PAI k8s cluster.")
        cluster_util.maintain_cluster_k8s(com, option_name="deploy", clean=True)
        logger.info("Finish initializing PAI k8s cluster.")

    def k8s_clean(self, args):
        # just use 'k8s-clean' for testing temporarily.
        cluster_object_model_instance = cluster_object_model(args.config_path)
        com = cluster_object_model_instance.run()
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
        cluster_util.maintain_cluster_k8s(com, option_name="clean", force=args.force, clean=True)
        logger.info("Clean up job finished")

    def k8s_set_environment(self, args):

        if args.config_path != None:
            args.config_path = os.path.expanduser(args.config_path)
            cluster_object_model_instance = cluster_object_model(args.config_path)
            com = cluster_object_model_instance.run()
        else:
            com = None
        kubectl_install_worker = kubectl_install.kubectl_install(com)
        kubectl_install_worker.run()


class Configuration(SubCmd):

    def register(self, parser):
        conf_parser = parser.add_subparsers(help="configuration operations")

        generate_parser = SubCmd.add_handler(conf_parser, self.generate_configuration, "generate",
                                             description="Generate configuration files based on a quick-start yaml file.",
                                             formatter_class=argparse.RawDescriptionHelpFormatter)
        push_parser = SubCmd.add_handler(conf_parser, self.push_configuration, "push",
                                           description="Push configuration to kubernetes cluster as configmap.",
                                           formatter_class=argparse.RawDescriptionHelpFormatter)
        pull_parser = SubCmd.add_handler(conf_parser, self.pull_configuration, "pull",
                                        description="Get the configuration stored in the k8s cluster.",
                                        formatter_class=argparse.RawDescriptionHelpFormatter)
        get_id_parser = SubCmd.add_handler(conf_parser, self.get_cluster_id, "get-id",
                                        description="Get the cluster-id stored in the k8s cluster.",
                                        formatter_class=argparse.RawDescriptionHelpFormatter)
        external_config_update_parser = SubCmd.add_handler(conf_parser, self.update_external_config, "external-config-update",
                                                           description="Update configuration of external storage where you could configure the place to sync the latest cluster configuration",
                                                           formatter_class=argparse.RawDescriptionHelpFormatter)

        generate_parser.add_argument("-i", "--input", dest="quick_start_config_file", required=True,
                                     help="the path of the quick-start configuration file (yaml format) as the input")
        generate_parser.add_argument("-o", "--output", dest="configuration_directory", required=True,
                                     help="the path of the directory the configurations will be generated to")
        generate_parser.add_argument("-f", "--force", dest="force", action="store_true", default=False,
                                     help="overwrite existing files")

        mutually_update_option = push_parser.add_mutually_exclusive_group()
        mutually_update_option.add_argument("-p", "--cluster-conf-path", dest="cluster_conf_path", default=None,
                                            help="the path of directory which stores the cluster configuration.")
        mutually_update_option.add_argument("-e", "--external-storage-conf-path", dest="external_storage_conf_path",  default=None,
                                            help="the path of external storage configuration.")
        push_parser.add_argument("-c", "--kube-config-path", dest="kube_config_path", default="~/.kube/config",
                                   help="The path to KUBE_CONFIG file. Default value: ~/.kube/config")

        pull_parser.add_argument("-o", "--config-output-path", dest="config_output_path", required=True,
                                help="the path of the directory to store the configuration downloaded from k8s.")
        pull_parser.add_argument("-c", "--kube-config-path", dest="kube_config_path", default="~/.kube/config",
                                   help="The path to KUBE_CONFIG file. Default value: ~/.kube/config")

        get_id_parser.add_argument("-c", "--kube-config-path", dest="kube_config_path", default="~/.kube/config",
                                   help="The path to KUBE_CONFIG file. Default value: ~/.kube/config")

        external_config_update_parser.add_argument("-e", "--extneral-storage-conf-path", dest="external_storage_conf_path", required=True,
                                                   help="the path of external storage configuration.")
        external_config_update_parser.add_argument("-c", "--kube-config-path", dest="kube_config_path", default="~/.kube/config",
                                                   help="The path to KUBE_CONFIG gile. Default value: ~/.kube/config")

    def generate_configuration(self, args):
        cluster_util.generate_configuration(
                args.quick_start_config_file,
                args.configuration_directory,
                args.force)

    def push_configuration(self, args):
        if args.cluster_conf_path != None:
            args.cluster_conf_path = os.path.expanduser(args.cluster_conf_path)
        if args.external_storage_conf_path != None:
            args.external_storage_conf_path = os.path.expanduser(args.external_storage_conf_path)
        if args.kube_config_path != None:
            args.kube_config_path = os.path.expanduser(args.kube_config_path)
        sync_handler = synchronization(
            pai_cluster_configuration_path=args.cluster_conf_path,
            local_conf_path=args.external_storage_conf_path,
            kube_config_path=args.kube_config_path
        )
        sync_handler.sync_data_from_source()

    def pull_configuration(self, args):
        if args.config_output_path != None:
            args.config_output_path = os.path.expanduser(args.config_output_path)
        if args.kube_config_path != None:
            args.kube_config_path = os.path.expanduser(args.kube_config_path)
        get_handler = download_configuration(
            config_output_path = args.config_output_path,
            kube_config_path = args.kube_config_path
        )
        get_handler.run()

    def get_cluster_id(self,args):
        if args.kube_config_path != None:
            args.kube_config_path = os.path.expanduser(args.kube_config_path)
        get_id_handler = get_cluster_id(kube_config_path=args.kube_config_path)
        get_id_handler.run()

    def update_external_config(self, args):
        if args.kube_config_path != None:
            args.kube_config_path = os.path.expanduser(args.kube_config_path)
        if args.external_storage_conf_path != None:
            args.external_storage_conf_path = os.path.expanduser(args.external_storage_conf_path)
        external_conf_update = uploading_external_config(
            external_storage_conf_path=args.external_storage_conf_path,
            kube_config_path=args.kube_config_path
        )
        external_conf_update.update_latest_external_configuration()


class Utility(SubCmd):
    def register(self, parser):
        utility_parser = parser.add_subparsers(help="utility for maintaining in a easy way.")

        ssh_parser = SubCmd.add_handler(utility_parser, self.cluster_ssh, "ssh")
        ssh_parser.add_argument("-p", "--config-path", dest="config_path", required=True, help="path of cluster configuration file")
        ssh_parser.add_argument("-f", "--filter", dest="filter", nargs='+', help="Rule to filter machine. Format: key1=value1 key2=value2 ...")
        ssh_parser.add_argument("-c", "--command", dest="command", required=True, help="The command to be executed remotely.")

        sftp_cp_parser = SubCmd.add_handler(utility_parser, self.cluster_sftp_copy, "sftp-copy")
        sftp_cp_parser.add_argument("-f", "--filter", dest="filter", nargs='+', help="Rule to filter machine. Format: key1=value1 key2=value2 ...")
        sftp_cp_parser.add_argument("-n", "--file-name", dest="file_name", required=True, help="File Name.")
        sftp_cp_parser.add_argument("-s", "--source", dest="source", required=True, help="The source path of the file.")
        sftp_cp_parser.add_argument("-d", "--destination", dest="dest", required=True, help="The target path of the file in the remote machines.")
        sftp_cp_parser.add_argument("-p", "--config-path", dest="config_path", required=True, help="path of cluster configuration file")

    def get_machine_list(self, config_path):
        objectModelFactoryHandler = cluster_object_model(configuration_path=config_path)
        return objectModelFactoryHandler.run()["machine"]["machine-list"]

    def rule_check(self, rule_list):
        if rule_list == None:
            return
        for rule in rule_list:
            kv = rule.split("=")
            if len(kv) != 2:
                logger.error("Please check the filter rule {0}. It's invalid.".format(rule))
                sys.exit(1)

    def cluster_ssh(self, args):
        if args.config_path != None:
            args.config_path = os.path.expanduser(args.config_path)
            machine_list = self.get_machine_list(args.config_path)
        else:
            machine_list = {}
        self.rule_check(args.filter)
        ssh_handler = OpenPaiSSH(args.command, machine_list, args.filter)
        ssh_handler.run()

    def cluster_sftp_copy(self, args):
        if args.config_path != None:
            args.config_path = os.path.expanduser(args.config_path)
            machine_list = self.get_machine_list(args.config_path)
        else:
            machine_list = {}
        if args.source != None:
            args.source = os.path.expanduser(args.source)
        if args.dest != None and os.path.isabs(args.dest) is not True:
            logger.error("The path of destination should an absolute path.")
            sys.exit(1)
        self.rule_check(args.filter)
        sftp_copy_handler = OpenPaiSftpCopy(args.file_name, args.source, args.dest, machine_list, args.filter)
        sftp_copy_handler.run()


class Main(SubCmd):
    def __init__(self, subcmds):
        self.subcmds = subcmds

    def register(self, parser):
        sub_parser = parser.add_subparsers(help="paictl operations")

        for name, subcmd in self.subcmds.items():
            subparser = SubCmd.add_handler(sub_parser, subcmd.run, name)
            subcmd.register(subparser)


def main(args):
    parser = argparse.ArgumentParser()

    main_handler = Main({
        "machine": Machine(),
        "service": Service(),
        "cluster": Cluster(),
        "config": Configuration(),
        "utility": Utility()
        })

    main_handler.register(parser)

    args = parser.parse_args(args)

    args.handler(args)


if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.realpath(__file__))
    os.chdir(script_dir)

    setup_logging()
    main(sys.argv[1:])

