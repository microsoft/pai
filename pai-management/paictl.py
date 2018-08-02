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
import sys
import argparse
import logging
import logging.config

from paiLibrary.common import linux_shell
from paiLibrary.common import file_handler
from paiLibrary.common import template_handler
from paiLibrary.clusterObjectModel import objectModelFactory
from paiLibrary.paiBuild import build_center
from paiLibrary.paiBuild import push_center
from paiLibrary.paiService import service_management_start
from paiLibrary.paiService import service_management_stop
from paiLibrary.paiService import service_management_delete
from paiLibrary.paiService import service_management_refresh
from paiLibrary.paiCluster import cluster_util

from k8sPaiLibrary.maintainlib import add as k8s_add
from k8sPaiLibrary.maintainlib import remove as k8s_remove
from k8sPaiLibrary.maintainlib import etcdfix as k8s_etcd_fix
from k8sPaiLibrary.maintainlib import kubectl_conf_check
from k8sPaiLibrary.maintainlib import kubectl_install


logger = logging.getLogger(__name__)



def setup_logging():
    """
    Setup logging configuration.
    """
    configuration_path = "sysconf/logging.yaml"
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



def login_docker_registry(docker_registry, docker_username, docker_password):

    shell_cmd = "docker login -u {0} -p {1} {2}".format(docker_username, docker_password, docker_registry)
    error_msg = "docker registry login error"
    linux_shell.execute_shell(shell_cmd, error_msg)
    logger.info("docker registry login successfully")



def generate_secret_base64code(docker_info):

    domain = docker_info[ "docker_registry_domain" ] and str(docker_info[ "docker_registry_domain" ])
    username = docker_info[ "docker_username" ] and str(docker_info[ "docker_username" ])
    passwd = docker_info[ "docker_password" ] and str(docker_info[ "docker_password" ])

    if domain == "public":
        domain = ""

    if username and passwd:
        login_docker_registry( domain, username, passwd )

        base64code = linux_shell.execute_shell_with_output(
            "cat ~/.docker/config.json | base64",
            "Failed to base64 the docker's config.json"
        )
    else:
        logger.info("docker registry authentication not provided")

        base64code = "{}".encode("base64")

    docker_info["base64code"] = base64code.replace("\n", "")



def generate_docker_credential(docker_info):

    username = docker_info[ "docker_username" ] and str(docker_info[ "docker_username" ])
    passwd = docker_info[ "docker_password" ] and str(docker_info[ "docker_password" ])

    if username and passwd:
        credential = linux_shell.execute_shell_with_output(
            "cat ~/.docker/config.json",
            "Failed to get the docker's config.json"
        )
    else:
        credential = "{}"

    docker_info["credential"] = credential



def generate_image_url_prefix(docker_info):

    domain = str(docker_info["docker_registry_domain"])
    namespace = str(docker_info["docker_namespace"])

    if domain != "public":
        prefix = "{0}/{1}/".format(domain, namespace)
    else:
        prefix = "{0}/".format(namespace)

    docker_info["prefix"] = prefix



def generate_etcd_ip_list(master_list):

    etcd_cluster_ips_peer = ""
    etcd_cluster_ips_server = ""
    separated = ""
    for infra in master_list:
        ip = master_list[ infra ][ 'hostip' ]
        etcdid = master_list[ infra ][ 'etcdid' ]
        ip_peer = "{0}=http://{1}:2380".format(etcdid, ip)
        ip_server = "http://{0}:4001".format(ip)

        etcd_cluster_ips_peer = etcd_cluster_ips_peer + separated + ip_peer
        etcd_cluster_ips_server = etcd_cluster_ips_server + separated + ip_server

        separated = ","

    return etcd_cluster_ips_peer, etcd_cluster_ips_server



def generate_configuration_of_hadoop_queues(cluster_config):
    """The method to configure VCs:
      - Each VC correspoonds to a Hadoop queue.
      - Each VC will be assigned with (capacity / total_capacity * 100%) of the resources in the system.
      - The system will automatically create the 'default' VC with 0 capacity, if 'default' VC has not
        been explicitly specified in the configuration file.
      - If all capacities are 0, resources will be split evenly to each VC.
    """
    hadoop_queues_config = {}
    #
    virtual_clusters_config = cluster_config["clusterinfo"]["virtualClusters"]
    if "default" not in virtual_clusters_config:
        logger.warn("VC 'default' has not been explicitly specified. " +
            "Auto-recoverd by adding it with 0 capacity.")
        virtual_clusters_config["default"] = {
            "description": "Default VC.",
            "capacity": 0
        }
    total_capacity = 0
    for vc_name in virtual_clusters_config:
        if virtual_clusters_config[vc_name]["capacity"] < 0:
            logger.warn("Capacity of VC '%s' (=%f) should be a positive number. " \
                % (vc_name, virtual_clusters_config[vc_name]["capacity"]) +
                "Auto-recoverd by setting it to 0.")
            virtual_clusters_config[vc_name]["capacity"] = 0
        total_capacity += virtual_clusters_config[vc_name]["capacity"]
    if float(total_capacity).is_integer() and total_capacity == 0:
        logger.warn("Total capacity (=%d) should be a positive number. " \
            % (total_capacity) +
            "Auto-recoverd by splitting resources to each VC evenly.")
        for vc_name in virtual_clusters_config:
            virtual_clusters_config[vc_name]["capacity"] = 1
            total_capacity += 1
    for vc_name in virtual_clusters_config:
        hadoop_queues_config[vc_name] = {
            "description": virtual_clusters_config[vc_name]["description"],
            "weight": float(virtual_clusters_config[vc_name]["capacity"]) / float(total_capacity) * 100
        }
    #
    cluster_config["clusterinfo"]["hadoopQueues"] = hadoop_queues_config



def cluster_object_model_generate_service(config_path):

    cluster_config = load_cluster_objectModel_service(config_path)

    generate_secret_base64code(cluster_config[ "clusterinfo" ][ "dockerregistryinfo" ])
    generate_docker_credential(cluster_config[ "clusterinfo" ][ "dockerregistryinfo" ])
    generate_image_url_prefix(cluster_config[ "clusterinfo" ][ "dockerregistryinfo" ])

    if 'docker_tag' not in cluster_config['clusterinfo']['dockerregistryinfo']:
        cluster_config['clusterinfo']['dockerregistryinfo']['docker_tag'] = 'latest'

    generate_configuration_of_hadoop_queues(cluster_config)

    return cluster_config



def cluster_object_model_generate_k8s(config_path):

    cluster_config = load_cluster_objectModel_k8s(config_path)

    master_list = cluster_config['mastermachinelist']
    etcd_cluster_ips_peer, etcd_cluster_ips_server = generate_etcd_ip_list(master_list)

    # ETCD will communicate with each other through this address.
    cluster_config['clusterinfo']['etcd_cluster_ips_peer'] = etcd_cluster_ips_peer
    # Other service will write and read data through this address.
    cluster_config['clusterinfo']['etcd_cluster_ips_server'] = etcd_cluster_ips_server
    cluster_config['clusterinfo']['etcd-initial-cluster-state'] = 'new'

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




def pai_build_info():

    logger.error("The command is wrong.")
    logger.error("Build image: paictl.py image build -p /path/to/configuration/ [ -n image-x ]")
    logger.error("Push image : paictl.py image push -p /path/to/configuration/ [ -n image-x ]")



def pai_build():

    if len(sys.argv) < 2:
        pai_build_info()
        return

    option = sys.argv[1]
    del sys.argv[1]

    if option not in ["build", "push"]:
        pai_build_info()
        return

    parser = argparse.ArgumentParser()
    parser.add_argument('-p', '--config-path', dest = "config_path", required=True, help="The path of your configuration directory.")
    parser.add_argument('-n', '--image-name', dest = "image_name", default='all', help="Build and push the target image to the registry")
    args = parser.parse_args(sys.argv[1:])

    config_path = args.config_path
    image_name = args.image_name
    cluster_object_model = load_cluster_objectModel_service(config_path)

    image_list = None
    if image_name != "all":
        image_list = [ image_name ]

    if option == "build":
        center = build_center.build_center(cluster_object_model, image_list)
        center.run()

    if option == "push":
        center = push_center.push_center(cluster_object_model, image_list)
        center.run()



def pai_machine_info():

    logger.error("The command is wrong.")
    logger.error("Add New Machine Node into cluster :  paictl.py machine add -p /path/to/configuration/ -l /path/to/nodelist.yaml")
    logger.error("Remove Machine Node from cluster  :  paictl.py machine remove -p /path/to/configuration/ -l /path/to/nodelist.yaml")
    logger.error("Repair Error Etcd Node in cluster :  paictl.py machine etcd-fix -p /path/to/configuration/ -l /path/to/nodelist.yaml")



def pai_machine():

    if len(sys.argv) < 2:
        pai_machine_info()
        return

    option = sys.argv[1]
    del sys.argv[1]

    if option not in ["add", "remove", "etcd-fix"]:
        pai_machine_info()
        return

    parser = argparse.ArgumentParser()
    parser.add_argument('-p', '--config-path', dest="config_path", required=True,
                        help="The path of your configuration directory.")
    parser.add_argument('-l', '--node-list', dest="node_list", required=True,
                        help="The node-list to be operator")
    args = parser.parse_args(sys.argv[1:])

    config_path = args.config_path
    node_lists_path = args.node_list

    cluster_object_model = cluster_object_model_generate_service(config_path)
    cluster_object_model_k8s = cluster_object_model_generate_k8s(config_path)
    node_list = file_handler.load_yaml_config(node_lists_path)

    if kubectl_env_checking(cluster_object_model_k8s) == False:
        return

    for host in node_list['machine-list']:

        if 'nodename' not in host:
            host['nodename'] = host['hostip']


    if option == "add":

        for host in node_list['machine-list']:
            add_worker = k8s_add.add(cluster_object_model_k8s, host, True)
            add_worker.run()

            if host['k8s-role'] == 'master':
                logger.info("Master Node is added, sleep 60s to wait it ready.")
                time.sleep(60)


    if option == "remove":

        for host in node_list['machine-list']:
            add_worker = k8s_remove.remove(cluster_object_model_k8s, host, True)
            add_worker.run()

            if host['k8s-role'] == 'master':
                logger.info("master node is removed, sleep 60s for etcd cluster's updating")
                time.sleep(60)


    if option == "etcd-fix":

        if len(node_list['machine-list']) > 1:
            logger.error("etcd-fix can't fix more than one machine everytime. Please fix them one by one!")
            sys.exit(1)

        for host in node_list['machine-list']:
            etcd_fix_worker = k8s_etcd_fix.etcdfix(cluster_object_model_k8s, host, True)
            etcd_fix_worker.run()

        logger.info("Etcd has been fixed.")





def pai_service_info():

    logger.error("The command is wrong.")
    logger.error("Start Service: paictl.py service start -p /path/to/configuration/ [ -n service-x ]")
    logger.error("Stop Service : paictl.py service stop -p /path/to/configuration/ [ -n service-x ]")
    logger.error("Delete Service (Stop Service, Then clean all service's data): paictl.py service delete -p /path/to/configuration/ [ -n service-x ]")
    logger.error("refresh Service (Update Configuration, Update Machine's Label): paictl.py service delete -p /path/to/configuration/ [ -n service-x ]")
    # TODO: Two feature.
    #logger.error("Rolling Update Service : paictl.py service update -p /path/to/configuration/ [ -n service-x ]")
    #logger.error("Rolling back Service : paictl.py service update -p /path/to/configuration/ [ -n service-x ]")



def pai_service():

    if len(sys.argv) < 2:
        pai_service_info()
        return

    option = sys.argv[1]
    del sys.argv[1]

    if option not in ["start", "delete", "stop", "refresh"]:
        pai_service_info()
        return

    parser = argparse.ArgumentParser()
    parser.add_argument('-p', '--config-path', dest="config_path", required=True,
                        help="The path of your configuration directory.")
    parser.add_argument('-n', '--service-name', dest="service_name", default='all',
                        help="Build and push the target image to the registry")
    args = parser.parse_args(sys.argv[1:])

    config_path = args.config_path
    service_name = args.service_name
    cluster_object_model = cluster_object_model_generate_service(config_path)
    cluster_object_model_k8s = cluster_object_model_generate_k8s(config_path)

    service_list = None
    if service_name != "all":
        service_list = [ service_name ]

    # Tricky ,  re-install kubectl first.
    # TODO: install kubectl-install here.
    if kubectl_env_checking(cluster_object_model_k8s) == False:
        return

    if option == "start":
        service_management_starter = service_management_start.serivce_management_start(cluster_object_model, service_list)
        service_management_starter.run()

    if option == "delete":
        service_management_deleter = service_management_delete.service_management_delete(cluster_object_model, service_list)
        service_management_deleter.run()

    if option == "stop":
        service_management_stopper = service_management_stop.service_management_stop(cluster_object_model, service_list)
        service_management_stopper.run()

    if option == "refresh":
        service_management_refresher = service_management_refresh.service_management_refresh(cluster_object_model, service_list)
        service_management_refresher.run()



def pai_cluster_info():

    logger.error("The command is wrong.")
    logger.error("Bootup kubernetes cluster : paictl.py cluster k8s-bootup -p /path/to/cluster-configuration/dir")
    logger.error("Destroy kubernetes cluster: paictl.py cluster k8s-clean -p /path/to/cluster-configuration/dir")



def pai_cluster():
    if len(sys.argv) < 2:
        pai_cluster_info()
        return
    option = sys.argv[1]
    del sys.argv[1]
    if option not in ["k8s-bootup", "k8s-clean", "generate-configuration"]:
        pai_cluster_info()
        return
    if option == "k8s-bootup":
        parser = argparse.ArgumentParser()
        parser.add_argument('-p', '--config-path', dest="config_path", required=True,
            help="path of cluster configuration file")
        args = parser.parse_args(sys.argv[1:])
        config_path = args.config_path
        cluster_config = cluster_object_model_generate_k8s(config_path)
        logger.info("Begin to initialize PAI k8s cluster.")
        cluster_util.maintain_cluster_k8s(cluster_config, option_name="deploy", clean=True)
        logger.info("Finish initializing PAI k8s cluster.")
    elif option == "generate-configuration":
        parser = argparse.ArgumentParser(
            description="Generate configuration files based on a quick-start yaml file.",
            formatter_class=argparse.RawDescriptionHelpFormatter)
        parser.add_argument('-i', '--input', dest="quick_start_config_file", required=True,
            help="the path of the quick-start configuration file (yaml format) as the input")
        parser.add_argument('-o', '--output', dest="configuration_directory", required=True,
            help="the path of the directory the configurations will be generated to")
        parser.add_argument('-f', '--force', dest='force', action='store_true', required=False,
            help="overwrite existing files")
        parser.set_defaults(force=False)
        args = parser.parse_args()
        cluster_util.generate_configuration(
            args.quick_start_config_file,
            args.configuration_directory,
            args.force)
    elif option == "k8s-clean":
        # just use 'k8s-clean' for testing temporarily  .
        parser = argparse.ArgumentParser()
        parser.add_argument('-p', '--config-path', dest="config_path", required=True, help="path of cluster configuration file")
        parser.add_argument('-f', '--force', dest="force", required=False, action="store_true", help="clean all the data forcefully")
        args = parser.parse_args(sys.argv[1:])
        config_path = args.config_path
        force = args.force
        cluster_config = cluster_object_model_generate_k8s(config_path)

        logger.warning("--------------------------------------------------------")
        logger.warning("--------------------------------------------------------")
        logger.warning("----------     Dangerous Operation!!!    ---------------")
        logger.warning("------     Your k8s Cluster will be destroyed    -------")
        logger.warning("------     PAI service on k8s will be stopped    -------")
        logger.warning("--------------------------------------------------------")
        if force:
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
        cluster_util.maintain_cluster_k8s(cluster_config, option_name = "clean", force = force, clean = True)
        logger.info("Clean up job finished")



def main():

    if len(sys.argv) < 2:
        logger.error("You should pass at least one argument")
        return

    module = sys.argv[1]
    del sys.argv[1]

    if module == "image":

        pai_build()

    elif module == "machine":

        pai_machine()

    elif module == "service":

        pai_service()

    elif module == "cluster":

        pai_cluster()

    else:

        logger.error("Sorry, there is no definition of the argument [{0}]".format(module))



if __name__ == "__main__":

    setup_logging()
    main()

