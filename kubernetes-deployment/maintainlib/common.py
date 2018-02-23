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
import errno
import sys
import subprocess
import jinja2
import argparse
import paramiko
import tarfile



def load_yaml_file(path):

    with open(path, "r") as f:
        file_data = yaml.load(f)

    return file_data



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
            "clusterconfig": cluster_config['clusterinfo'],
            "cluster": cluster_config
        }
    )

    return generated_file



def write_generated_file(generated_file, file_path):

    with open(file_path, "w+") as fout:
        fout.write(generated_file)



def sftp_paramiko(src, dst, filename, host_config):

    hostip = host_config['hostip']
    username = host_config['username']
    password = host_config['password']
    port = 22
    if 'sshport' in host_config:
        port = host_config['sshport']

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
    if 'sshport' in host_config:
        port = host_config['sshport']

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=hostip, port=port, username=username, password=password)
    stdin, stdout, stderr = ssh.exec_command(commandline, get_pty=True)
    stdin.write(password + '\n')
    stdin.flush()
    print "Executing the command on host [{0}]: {1}".format(hostip, commandline)
    for response_msg in stdout:
        print response_msg.strip('\n')

    ssh.close()



def create_path(path):

    if not os.path.exists("{0}".format(path)):
        
        try:
            os.makedirs(path)
        except OSError as exc:
            if exc.errno == errno.EEXIST and os.path.isdir(path):
                pass
            else:
                raise



def archive_tar(target, path):

    tar = tarfile.open("target")

    for root,dir,files in os.walk(path):
        for file in files:
            fullpath = os.path.join(root, path)
            tar.add(fullpath)

    tar.close()



def maintain_package_wrapper(cluster_config, maintain_config, node_config, jobname):
    
    create_path("parcel-center/{0}/{1}".format(node_config['nodename'], jobname))

    for template_info in maintain_config[jobname]["template-list"]:

        name = template_info['name']
        src = template_info['src']
        dst = template_info['dst']

        template_data = read_template("{0}".format(src))
        template_file = generate_from_template(template_data, cluster_config, node_config)
        create_path("parcel-center/{0}/{1}".format(node_config['nodename'], dst))
        write_generated_file(template_file, "parcel-center/{0}/{1}/{2}".format(node_config['nodename'], dst, name))


    for file_info in maintain_config[jobname]["file-list"]:

        name = file_info['name']
        src = file_info['src']
        dst = file_info['dst']
        create_path("parcel-center/{0}/{1}".format(node_config['nodename'], dst))
        execute_shell(
            "cp {0} parcel-center/{1}/{2}/{3}".format(src, node_config['nodename'], dst, name),
            "Failed copy {0} parcel-center/{1}/{2}/{3}".format(src, node_config['nodename'], dst, name)
        )

    execute_shell("cp -r parcel-center/{0}/{1} .".format(node_config['nodename'], jobname), "Failed cp job folder")
    archive_tar("parcel-center/{0}/{1}.tar".format(node_config['nodename'], jobname), jobname)
    execute_shell("rm -rf {0}".format(jobname), "Failed to remove {0}".format(jobname))



def maintain_package_cleaner(node_config):

    execute_shell(
        "rm -rf parcel-center/{0}".format(node_config['nodename']),
        "Failed to remove parcel-center/{0}".format(node_config['nodename'])
    )