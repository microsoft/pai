#!/usr/bin/env python3
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

import argparse
import re
import os
import sys
import time
import random
import string
import configparser
import subprocess
import logging
import getpass
import socket
import requests

USERNAME = ""
TOKEN = ""
SERVER_IP = ""
USER_DIR = ""
SSH_INFO = ""
LOGGER = ""
SSH_INFO = {}
IS_SHELL = ""
JOB_NAME = ""


def read_env():
    global USERNAME, TOKEN, SERVER_IP
    LOGGER.debug("read env")
    cf = configparser.ConfigParser()
    cf.read(".env")
    USERNAME = cf.get("PAI_ENV", "username")
    TOKEN = cf.get("PAI_ENV", "token")
    SERVER_IP = cf.get("PAI_ENV", "serverip")


def check_platform():
    LOGGER.debug("check platform")
    global IS_SHELL, USER_DIR
    if sys.platform.find("win") != -1:
        IS_SHELL = False
        USER_DIR = os.environ.get('UserProfile')
    elif sys.platform.find("linux") != -1:
        IS_SHELL = True
        USER_DIR = os.environ["HOME"]
    else:
        LOGGER.debug("unsupported platform")
        exit(-1)


def generate_conf():
    LOGGER.debug("generate conf files")
    pai_dir = os.path.join(USER_DIR, ".openpai/")
    if not os.path.exists(pai_dir):
        os.makedirs(pai_dir)
    conf_files = ['clusters', 'exports']
    for conf_file in conf_files:
        f1 = open("conf/{}.template".format(conf_file), 'r+')
        f2 = open("{}{}.yaml".format(pai_dir, conf_file), 'w+')
        for line in f1.readlines():
            line = re.sub("\$username", USERNAME, line)
            line = re.sub("\$token", TOKEN, line)
            line = re.sub("\$serverip", SERVER_IP, line)
            f2.write(line)
        f1.close()
        f2.close()


def init():
    global LOGGER
    logging.basicConfig(level=logging.INFO, format='%(asctime)s-%(name)s-%(levelname)s-%(message)s')
    LOGGER = logging.getLogger(__name__)
    script_folder = os.path.dirname(os.path.realpath(__file__))
    os.chdir(script_folder)
    read_env()
    check_platform()
    generate_conf()


def read_input(message):
    while True:
        answer = input("{} (y/n)?".format(message))
        if answer in {"Y", "y", "yes", "Yes", "YES"}:
            return True
        elif answer in {"N", "n", "no", "No", "NO"}:
            return False


def run_subprocess(command):
    LOGGER.debug("run subprocess {}, shell={}".format(command, IS_SHELL))
    p = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=IS_SHELL)
    p_output, p_error = p.communicate()
    LOGGER.debug(p_output)
    if p.returncode != 0:
        LOGGER.debug(p_error)
    return p_output.decode("utf-8", "ignore")


def get_args():
    parser = argparse.ArgumentParser(description="Remote Development Tool")
    parser.add_argument("-g", "--getssh", metavar="job_name", help="get ssh info", dest="job_name")
    parser.add_argument("-c", "--config", metavar='job_path', help="submit local job", dest="job_path")
    parser.add_argument("-s", "--share", metavar="share_path", help="share local folder", dest="share_path")
    parser.add_argument("-v", "--verbose", action="store_true", help="verbose mode", dest='need_verbose')
    args = parser.parse_args()
    if len(sys.argv) < 2 or (len(sys.argv) == 2 and args.need_verbose is True):
        parser.print_help()
        parser.exit(-1)
    if args.job_name is not None and args.job_path is not None:
        LOGGER.info("cannot use --submit and --getssh at the same time")
        parser.print_help()
        parser.exit(-1)
    if args.job_name is None and args.job_path is None:
        LOGGER.info("cannot use without both --submit and --getssh")
        parser.print_help()
        parser.exit(-1)

    return args


def get_ssh_info(job_name):
    global LOGGER, SSH_INFO, USER_DIR, JOB_NAME
    LOGGER.debug("get SSH info")
    JOB_NAME = job_name
    pai_dir = os.path.join(USER_DIR, ".openpai/")

    while True:
        LOGGER.info("wait for the ssh to start")
        output = run_subprocess("opai job status -a remote_dev_bed {} ssh".format(job_name))
        ssh_port = re.findall(r"sshPort: '(.+?)'", output)
        ssh_ip = re.findall(r"sshIp: (.+?)\n", output)
        ssh_link = re.findall(r"privateKeyDirectDownloadLink: (.+?)\n", output)
        if len(ssh_ip) != 0 and len(ssh_port) != 0 and len(ssh_link) != 0:
            break
        time.sleep(10)
    ssh_ip = re.sub("\r", "", ssh_ip[0])
    ssh_port = ssh_port[0]
    ssh_link = re.sub("\r", "", ssh_link[0])
    LOGGER.debug("download SSH key")
    req = requests.get(ssh_link)
    ssh_key = os.path.abspath("{}{}.key".format(pai_dir, job_name))
    with open(ssh_key, "w+") as f:
        f.write(req.text)
    f.close()

    if IS_SHELL is True:
        run_subprocess("chmod 600 {}".format(ssh_key))
    ssh_cmd = "ssh -i {} -p {} -o StrictHostKeyChecking=no root@{}".format(ssh_key, ssh_port, ssh_ip)
    LOGGER.info("SSH IP: {}".format(ssh_ip))
    LOGGER.info("SSH Port: {}".format(ssh_port))
    LOGGER.info("SSH Key: {}".format(ssh_key))
    LOGGER.info("SSH CMD: {}".format(ssh_cmd))
    SSH_INFO['ip'] = ssh_ip
    SSH_INFO['port'] = ssh_port
    SSH_INFO['key'] = ssh_key
    SSH_INFO['cmd'] = ssh_cmd
    configure_vscode()


def share_local_path(local_path):
    global SSH_INFO
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect(("www.microsoft.com", 80))
    host_ip = s.getsockname()[0]
    s.close()
    if read_input("Is your host ip {}".format(host_ip)) is False:
        host_ip = input("Please input your host IP: ")
    if IS_SHELL is False:
        ms_username = getpass.getuser() + "@microsoft.com"
        if read_input("Is your user name {}".format(ms_username)) is False:
            ms_username = input("Please input your username: ")
        ms_password = getpass.getpass("Please input your password: ")
        run_subprocess(r'net share dev="{}" /GRANT:{},FULL'.format(local_path, ms_username))
        SSH_INFO['mount'] = "mount -t cifs //{}/dev /mnt/local -o vers=3.0,username={},password={}".format(
            host_ip,
            ms_username,
            ms_password)
    else:
        run_subprocess(r"docker stop remote_dev_nfs &> /dev/null || true")
        run_subprocess(r"docker rm remote_dev_nfs &> /dev/null || true")
        run_subprocess(r"docker run -itd --privileged --cap-add SYS_ADMIN --cap-add SYS_MODULE \
                -v /lib/modules:/lib/modules:ro \
                -v {}:/workspace \
                -v ~/.openpai/exports.yaml:/etc/exports:ro\
                -p 2049:2049 --name remote_dev_nfs \
                erichough/nfs-server &> /dev/null".format(local_path))
        SSH_INFO['mount'] = "mount -t nfs4 {}:/ /mnt/local".format(host_ip)


def submit_job(job_path):
    global JOB_NAME
    LOGGER.debug("submit job")
    job_name = "".join(random.sample(string.ascii_letters + string.digits, 10))
    job_name = "remote_dev_{}".format(job_name)
    JOB_NAME = job_name
    run_subprocess(
        "opai job submit -a remote_dev_bed --update name={} {}".format(job_name, job_path))

    while True:
        LOGGER.info("wait for the job to run")
        output = run_subprocess("opai job status -a remote_dev_bed {}".format(job_name))
        if output.find("RUNNING") != -1:
            break
        time.sleep(10)
    LOGGER.info("job name: {}".format(job_name))
    LOGGER.info("job started")
    time.sleep(10)
    get_ssh_info(job_name)


def configure_vscode():
    LOGGER.debug("configure vscode")
    vscode_dir = os.path.join(USER_DIR, ".ssh", "config")
    with open(vscode_dir, 'a+') as f:
        f.write("\nHost {}\n".format(JOB_NAME))
        f.write("    Hostname {}\n".format(SSH_INFO["ip"]))
        f.write("    Port {}\n".format(SSH_INFO['port']))
        f.write("    User root\n")
        f.write("    IdentityFile {}".format(SSH_INFO['key']))
        f.close()


def start_ssh(share_path):
    if share_path is not None:
        run_subprocess(r'{} "apt update && apt install -y nfs-common cifs-utils"'.format(SSH_INFO['cmd']))
        run_subprocess(r'{} "mkdir -p /mnt/local"'.format(SSH_INFO['cmd']))
        run_subprocess(r'{} "{}"'.format(SSH_INFO['cmd'], SSH_INFO['mount']))
    subprocess.run(SSH_INFO['cmd'], shell=IS_SHELL)
    run_subprocess("net share dev /delete || cd .")


def main():
    init()
    args = get_args()
    if args.need_verbose is True:
        LOGGER.setLevel(logging.DEBUG)
    if args.job_name is not None:
        if args.job_name.find("~") != -1:
            split_str = args.job_name.split("~");
            if len(split_str) == 2:
                get_ssh_info(split_str[1])
            else:
                LOGGER.error("Wrong job name")
        else:
            get_ssh_info(args.job_name)
    if args.job_path is not None:
        submit_job(args.job_path)
    if args.share_path is not None:
        share_local_path(args.share_path)
    time.sleep(5)
    start_ssh(args.share_path)


if __name__ == "__main__":
    main()
