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
import paramiko



def execute_shell(shell_cmd, error_msg):

    try:
        subprocess.check_call( shell_cmd, shell=True )

    except subprocess.CalledProcessError:
        print error_msg
        sys.exit(1)



def read_template(template_path):

    with open(template_path, "r") as fin:
        template_data = fin.read()

    return template_data



def generate_from_template(template_data, cluster_config, host_config):

    generated_file = jinja2.Template(template_data).render(
        {
            "hostcofig": host_config,
            "clusterconfig": cluster_config['clusterinfo']
        }
    )

    return generated_file



def write_generated_file(generated_file, file_path):

    with open(file_path, "w+") as fout:
        fout.write(generated_file)



def load_cluster_config(config_path):

    with open(config_path, "r") as f:
        cluster_data = yaml.load(f)

    return cluster_data



def execute_shell_with_output(shell_cmd, error_msg):

    try:
        res = subprocess.check_output( shell_cmd, shell=True )

    except subprocess.CalledProcessError:
        print error_msg
        sys.exit(1)

    return res



def sftp_paramiko(src, dst, filename, host_config):

    hostip = host_config['hostip']
    username = host_config['username']
    password = host_config['password']
    port = 22

    # First make sure the folder exist.
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=hostip, port=port, username=username, password=password)

    stdin, stdout, stderr = ssh.exec_command("sudo mkdir -p {0}".format(dst), get_pty=True)
    stdin.write(password + '\n')
    stdin.flush()
    for response_msg in stdout:
        print response_msg.strip('\n')

    ssh.close()

    # Put the file to target Path.
    transport = paramiko.Transport((hostip, port))
    transport.connect(username=username, password=password)

    sftp = paramiko.SFTPClient.from_transport(transport)
    sftp.put('{0}/{1}'.format(src, filename), '{0}/{1}'.format(dst, filename))
    sftp.close()

    transport.close()



def ssh_shell_paramiko(host_config, commandline):

    hostip = host_config['hostip']
    username = host_config['username']
    password = host_config['password']
    port = 22

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=hostip, port=port, username=username, password=password)
    stdin, stdout, stderr = ssh.exec_command(commandline, get_pty=True)
    stdin.write(password + '\n')
    stdin.flush()

    for response_msg in stdout:
        print response_msg.strip('\n')

    ssh.close()



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

    sftp_paramiko(src_local, dst_remote, srcipt_package, host_config)
    commandline = "tar -xvf kubernetes.tar && sudo ./src/start.sh {0}:8080 {1} {2}".format(cluster_info['api-servers-ip'], host_config['username'], host_config['hostip'])
    ssh_shell_paramiko(host_config, commandline)



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

    execute_shell( "kubectl get node", "Error in kubectl installing" )



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



def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('-p', '--path', required=True, help='path of cluster configuration file')

    args = parser.parse_args()

    config_path = args.path
    cluster_config = load_cluster_config(config_path)

    master_list = cluster_config['mastermachinelist']
    etcd_cluster_ips_peer, etcd_cluster_ips_server = generate_etcd_ip_list(master_list)

    # ETCD will communicate with each other through this address.
    cluster_config['clusterinfo']['etcd_cluster_ips_peer'] = etcd_cluster_ips_peer
    # Other service will write and read data through this address.
    cluster_config['clusterinfo']['etcd_cluster_ips_server'] = etcd_cluster_ips_server


    listname = cluster_config['remote_deployment']['master']['listname']
    machine_list = cluster_config[ listname ]

    for hostname in machine_list:

        bootstrapScriptGenerate(cluster_config, machine_list[hostname], "master")
        remoteBootstrap(cluster_config['clusterinfo'], machine_list[hostname])


    listname = cluster_config['remote_deployment']['worker']['listname']
    machine_list = cluster_config[listname]

    for hostname in machine_list:
        bootstrapScriptGenerate(cluster_config, machine_list[hostname], "worker")
        remoteBootstrap(cluster_config['clusterinfo'], machine_list[hostname])


    #step : Install kubectl on the host.
    kubectl_install(cluster_config[ 'clusterinfo' ])

    #step : dashboard startup
    dashboard_startup(cluster_config[ 'clusterinfo' ])

    print "Done !"



if __name__ == "__main__":
    main()