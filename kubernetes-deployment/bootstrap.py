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

import yaml
import os
import sys
import subprocess
import jinja2
import argparse
import maintainlib
import importlib
import time
import logging
import logging.config


from maintainlib import common as pai_common



logger = logging.getLogger(__name__)



def execute_shell(shell_cmd, error_msg):

    try:
        subprocess.check_call( shell_cmd, shell=True )

    except subprocess.CalledProcessError:

        logger.error(error_msg)
        sys.exit(1)



def execute_shell_return(shell_cmd, error_msg):

    try:
        subprocess.check_call( shell_cmd, shell=True )

    except subprocess.CalledProcessError:

        logger.error(error_msg)
        return False

    return True



def read_template(template_path):

    with open(template_path, "r") as fin:
        template_data = fin.read()

    return template_data



def generate_from_template(template_data, cluster_config, host_config):

    generated_file = jinja2.Template(template_data).render(
        {
            "hostcofig": host_config,
            "clusterconfig": cluster_config['clusterinfo'],
            "cluster": cluster_config
        }
    )

    return generated_file



def write_generated_file(generated_file, file_path):

    with open(file_path, "w+") as fout:
        fout.write(generated_file)



def load_yaml_file(path):

    with open(path, "r") as f:
        file_data = yaml.load(f)

    return file_data



def load_cluster_config(config_path):

    return load_yaml_file(config_path)



def execute_shell_with_output(shell_cmd, error_msg):

    try:
        res = subprocess.check_output( shell_cmd, shell=True )

    except subprocess.CalledProcessError:

        logger.error(error_msg)
        sys.exit(1)

    return res



def bootstrapScriptGenerate(cluster_config, host_config, role):

    src = "template"
    dst = "template/generated/{0}".format(host_config[ "hostip" ])
    host_dir = "template/generated/{0}".format(host_config[ "hostip" ])

    if not os.path.exists(dst):
        execute_shell("mkdir -p {0}".format(dst), "failed to create folder {0}".format(dst))


    delete_list = []
    for component in cluster_config['remote_deployment'][role]['component']:

        component_name = component['name']
        template_list = cluster_config['component_list'][component_name]

        for template in template_list:

            if not os.path.exists("{0}/{1}".format(dst, template['dst'])):
                execute_shell(
                    "mkdir -p {0}/{1}".format(dst, template['dst']),
                    "failed to create folder {0}/{1}".format(dst, template['dst'])
                )

            template_data = read_template("{0}/{1}.template".format(src, template['src']))
            template_file = generate_from_template(template_data, cluster_config, host_config)
            write_generated_file(template_file, "{0}/{1}/{2}".format(dst, template['dst'], template['src'] ))

        if 'deleteAfterGenerate' in component and component['deleteAfterGenerate'] == 'True':
            delete_list.append(component)


    for deleted_component in delete_list:
        cluster_config['remote_deployment'][role]['component'].remove(deleted_component)


    # packege all the script to sftp.
    execute_shell("cp start.sh {0}/src".format(dst), "Failed copy start.sh to {0}".format(dst))
    execute_shell("cp cleanup.sh {0}/src".format(dst), "Failed copy cleanup.sh to {0}".format(dst))
    execute_shell("cp -r {0}/src .".format(dst), "Failed cp src")
    execute_shell(
                  "tar -cvf {0}/kubernetes.tar src".format(host_dir),
                  "Failed to package the script"
                 )
    execute_shell("rm -rf src", "Failed to remove src")



def remoteBootstrap(cluster_info, host_config):

    # sftp your script to remote host with paramiko.
    srcipt_package = "kubernetes.tar"
    src_local = "template/generated/{0}".format(host_config["hostip"])
    dst_remote = "/home/{0}".format(host_config["username"])

    if pai_common.sftp_paramiko(src_local, dst_remote, srcipt_package, host_config) == False:
        return

    commandline = "tar -xvf kubernetes.tar && sudo ./src/start.sh {0}:8080 {1} {2}".format(cluster_info['api-servers-ip'], host_config['username'], host_config['hostip'])

    if pai_common.ssh_shell_paramiko(host_config, commandline) == False:
        return



def remoteCleanUp(cluster_info, host_config):

    srcipt = "cleanup.sh"
    src_local = "./"
    dst_remote = "/home/{0}".format(host_config["username"])

    if pai_common.sftp_paramiko(src_local, dst_remote, srcipt, host_config) == False:
        return

    commandline = "sudo sh cleanup.sh"

    if pai_common.ssh_shell_paramiko(host_config, commandline) == False:
        return



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



def kubectl_install(cluster_info):
    # command detail, pls refer to https://kubernetes.io/docs/tasks/tools/install-kubectl/

    execute_shell(
        "mkdir -p ~/.kube",
        "failed curl in the first step of installing kubectl"
    )

    execute_shell(
        "curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl",
        "failed curl in the first step of installing kubectl"
    )

    execute_shell(
        "chmod +x ./kubectl",
        "failed guarantee executable permission to kubectl "
    )

    if not os.path.exists("/usr/local/bin"):
        execute_shell(
            "mkdir -p /usr/local/bin",
            "failed to create folder /usr/local/bin"
        )

    execute_shell(
        "mv ./kubectl /usr/local/bin/kubectl",
        "failed mv kubectl to path "
    )

    template_data = read_template("template/config.template")
    generated_file = jinja2.Template(template_data).render(
        {
            "clusterconfig": cluster_info
        }
    )

    kube_config_path = os.path.expanduser("~/.kube")
    write_generated_file(generated_file, "{0}/config".format(kube_config_path))

    while True:
        res = execute_shell_return( "kubectl get node", "Error in kubectl installing" )

        if res == True:
            break



def dashboard_startup(cluster_info):

    template_data = read_template("template/dashboard-service.yaml.template")
    generated_file = jinja2.Template(template_data).render(
        {
            "clusterconfig": cluster_info
        }
    )
    write_generated_file(generated_file, "template/generated/dashboard-service.yaml")

    template_data = read_template("template/dashboard-deployment.yaml.template")
    generated_file = jinja2.Template(template_data).render(
        {
            "clusterconfig": cluster_info
        }
    )
    write_generated_file(generated_file, "template/generated/dashboard-deployment.yaml")

    execute_shell(
                    "kubectl create -f template/generated/dashboard-service.yaml",
                    "Failed to create dashboard-service"
                 )

    execute_shell(
                    "kubectl create -f template/generated/dashboard-deployment.yaml",
                    "Failed to create dashboard-deployment"
                 )



def kube_proxy_startup(cluster_config):

    template_data = read_template("template/kube-proxy.yaml.template")
    generated_file = jinja2.Template(template_data).render(
        {
            "clusterconfig": cluster_config['clusterinfo']
        }
    )
    write_generated_file(generated_file, "template/generated/kube-proxy.yaml")

    execute_shell(
        "kubectl create -f template/generated/kube-proxy.yaml",
        "Failed to create kube-proxy"
    )



def kubernetes_nodelist_deployment(cluster_config, machine_list, role, clean):

    for hostname in machine_list:
        if clean:
            remoteCleanUp(cluster_config['clusterinfo'], machine_list[hostname])
        else:
            bootstrapScriptGenerate(cluster_config, machine_list[hostname], role)
            remoteBootstrap(cluster_config['clusterinfo'], machine_list[hostname])



def initial_bootstrap_cluster(cluster_config):

    if 'proxy' in cluster_config['remote_deployment']:
        listname = cluster_config['remote_deployment']['proxy']['listname']
        machine_list = cluster_config[listname]
        kubernetes_nodelist_deployment(cluster_config, machine_list, "proxy", False)

    listname = cluster_config['remote_deployment']['master']['listname']
    machine_list = cluster_config[listname]
    kubernetes_nodelist_deployment(cluster_config, machine_list, "master", False)

    listname = cluster_config['remote_deployment']['worker']['listname']
    machine_list = cluster_config[listname]
    kubernetes_nodelist_deployment(cluster_config, machine_list, "worker", False)



def destory_whole_cluster(cluster_config):

    for role in cluster_config['remote_deployment']:
        listname = cluster_config['remote_deployment'][role]['listname']
        machine_list = cluster_config[listname]
        kubernetes_nodelist_deployment(cluster_config, machine_list, role, True)



def add_new_nodes(cluster_config, node_list_config):
    role = node_list_config['remote_deployment_role']
    machine_list = node_list_config['machinelist']
    #Todo: add validation here
    kubernetes_nodelist_deployment(cluster_config, machine_list, role, False)



def remove_nodes(cluster_config, node_list_config):
    role = node_list_config['remote_deployment_role']
    machine_list = node_list_config['machinelist']
    for host in machine_list:
        execute_shell(
            "kubectl delete node {0}".format(machine_list[host]['nodename']),
            "Failed to delete  node {0}".format(machine_list[host]['nodename'])
        )

    # Todo: add validation here
    kubernetes_nodelist_deployment(cluster_config, machine_list, role, True)



def maintain_one_node(cluster_config, node_config, job_name):

    module_name = "maintainlib.{0}".format(job_name)
    module = importlib.import_module(module_name)

    job_class = getattr(module, job_name)
    job_instance = job_class(cluster_config, node_config, True)

    job_instance.run()



def maintain_nodes(cluster_config, node_list_config, job_name):

    # Todo: load maintain from a DB such as etcd instead of a yaml file.
    #maintain_config = load_yaml_file("maintain.yaml")

    for host in node_list_config['machinelist']:

        maintain_one_node(cluster_config, node_list_config['machinelist'][host], job_name)



def option_validation(args):

    ret = False

    option_list_without_file = ['deploy', 'clean', 'install_kubectl']
    if args.action in option_list_without_file:
        if args.file != None:
            logger.error("Option -a [deploy, clean, install_kubectl] shouldn't combine with option -f")
            return False
        ret = True

    option_list_with_file = ['add', 'remove', 'repair', 'etcdfix']
    if args.action in option_list_with_file:
        if args.file == None:
            logger.error("Option -a [add, remove, repair, etcdfix] should combine with option -f")
            return False
        ret = True

    if ret == False:
        logger.error("{0} is non_existent".format(args.action))


    return ret



def setup_logging():
    """
    Setup logging configuration.
    """
    configuration_path = "sysconf/logging.yaml"

    logging_configuration = pai_common.load_yaml_file(configuration_path)
    
    logging.config.dictConfig(logging_configuration)



def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('-p', '--path', required=True, help='path of cluster configuration file')
    parser.add_argument('-a', '--action', required=True, default=None, help="action to maintain the cluster")
    parser.add_argument('-f', '--file', default=None, help="An yamlfile with the nodelist to maintain")

    args = parser.parse_args()

    logger.info("Begin option validation! ")
    if option_validation(args) == False:
        return
    logger.info("Pass option validation! ")

    config_path = args.path
    cluster_config = load_cluster_config(config_path)

    master_list = cluster_config['mastermachinelist']
    etcd_cluster_ips_peer, etcd_cluster_ips_server = generate_etcd_ip_list(master_list)

    # ETCD will communicate with each other through this address.
    cluster_config['clusterinfo']['etcd_cluster_ips_peer'] = etcd_cluster_ips_peer
    # Other service will write and read data through this address.
    cluster_config['clusterinfo']['etcd_cluster_ips_server'] = etcd_cluster_ips_server
    cluster_config['clusterinfo']['etcd-initial-cluster-state'] = 'new'

    if args.action == 'add':

        logger.info("Begin to add new nodes to PAI cluster.")

        #Todo in the future we should finish the following two line
        #cluster_config = get_cluster_configuration()
        #node_list_config = get_node_list_config()
        node_list_config = load_yaml_file(args.file)
        add_new_nodes(cluster_config, node_list_config)
        #up_data_cluster_configuration()

        logger.info("New nodes have been added.")
        return

    if args.action == 'remove':

        logger.info("Begin to remove nodes from PAI cluster.")

        # Todo in the future we should finish the following two line
        # cluster_config = get_cluster_configuration()
        # node_list_config = get_node_list()
        node_list_config = load_yaml_file(args.file)
        remove_nodes(cluster_config, node_list_config)
        # up_data_cluster_configuration()

        logger.info("Nodes have been removed.")
        return

    if args.action == 'repair':

        logger.info("Begin to repair the target nodes.")

        # Todo in the future we should finish the following two line
        # cluster_config = get_cluster_configuration()
        # node_list_config = get_node_list()
        node_list_config = load_yaml_file(args.file)
        maintain_nodes(cluster_config, node_list_config, args.action)

        logger.info("The nodes have been repaired.")
        return

    if args.action == 'clean':

        logger.info("Begin to clean up whole cluster.")

        destory_whole_cluster(cluster_config)

        logger.info("Clean up job finished")
        return

    if args.action == 'etcdfix':

        logger.info("Begin to fix broken etcd server.")

        node_list_config = load_yaml_file(args.file)

        logger.debug("FIX ETCD on {0}".format(str(node_list_config)))

        if len(node_list_config['machinelist']) != 1:

            logger.error("etcdfix can't fix more than one machine everytime. Please fix them one by one!")
            sys.exit(1)

        maintain_nodes(cluster_config, node_list_config, args.action)

        logger.info("Etcd has been fixed.")
        return

    if args.action == 'deploy':

        logger.info("Begin to initialize PAI.")

        initial_bootstrap_cluster(cluster_config)


    if args.action == 'deploy' or args.action == 'install_kubectl':

        logger.info("Begin to install kubectl.")

        kubectl_install(cluster_config[ 'clusterinfo' ])

        logger.info("Kubectl has been installed.")

    if args.action == 'deploy':
        #step:  Kube-proxy
        kube_proxy_startup(cluster_config)

        #step : dashboard startup
        dashboard_startup(cluster_config[ 'clusterinfo' ])

        logger.info("Finish initializing PAI.")


    logger.info("Maintenance Finished!")



if __name__ == "__main__":

    setup_logging()

    main()