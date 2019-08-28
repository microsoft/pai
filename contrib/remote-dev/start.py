import re
import os
import sys
import time
import random
import string
import requests
import configparser
import subprocess
import datetime


def read_inpur():
  while (True):
    answer = input("Do you wish to continue (y/n)?")
    if answer == "Y" or answer == "y":
      break
    elif answer == "N" or answer == 'n':
      exit(0)


def print_output(info):
  now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')
  print(now, info)


def replace(line):
  tt = re.sub("\$username", username, line)
  tt = re.sub("\$password", password, tt)
  tt = re.sub("\$serverip", serverip, tt)
  return tt


# read env vars
print_output("Read .env")
cf = configparser.ConfigParser()
cf.read(".env")
username = cf.get("PAI_ENV", "username")
password = cf.get("PAI_ENV", "password")
serverip = cf.get("PAI_ENV", "serverip")
jobname = "".join(random.sample(string.ascii_letters + string.digits, 10))
jobname = "remote_dev_" + jobname

print(jobname)
# generate conf files
print_output("Generate conf files")
if sys.platform.find("win") != -1:
  userdir = os.environ.get('UserProfile') + "/.openpai/"
  is_shell = False
elif sys.platform.find("linux") != -1:
  userdir = os.environ['HOME'] + "/.openpai/"
  is_shell = True
else:
  print_output("Unsupported platform")
  exit(-1)
userdir = os.path.abspath(userdir)
if sys.platform.find("win") != -1:
  userdir = userdir + "\\"
elif sys.platform.find("linux") != -1:
  userdir = userdir + "/"
if not os.path.exists(userdir):
  os.makedirs(userdir)
conf_files = ['clusters', 'job', 'exports']
for conf_file in conf_files:
  f1 = open("conf/" + conf_file + ".template", 'r+')
  f2 = open(userdir + conf_file + ".yaml", 'w+')
  for line in f1.readlines():
    f2.write(replace(line))
  f1.close()
  f2.close()

# display PAI cluster
print_output("Display PAI cluster")
subprocess.call("opai cluster list", shell=is_shell)
read_inpur()

# submit job
print_output("Submit job")
subprocess.call("opai job submit -a remote_dev_bed --update name=" + jobname + " " + userdir +
                "/job.yaml", shell=is_shell)
print_output("Your job name is " + jobname)

# wait for running
while (True):
  print_output("Wait for the job to run")
  return_output = subprocess.check_output("opai job status -a remote_dev_bed " + jobname, shell=is_shell).decode()
  if return_output.find("RUNNING") != -1:
    break
  time.sleep(10)
print_output("Job started")
time.sleep(10)

# download ssh key
print_output("Download SSH key")
return_output = subprocess.check_output("opai job status -a remote_dev_bed " + jobname +
                                        " ssh", shell=is_shell).decode()
ssh_link = re.findall(r"privateKeyDirectDownloadLink: (.+?)\n", return_output)
if len(ssh_link) == 0:
  print_output("No SSH key found")
else:
  ssh_link = re.sub("\r", "", ssh_link[0])
req = requests.get(ssh_link)
with open(userdir + jobname + ".key", "w+") as f:
  f.write(req.text)
f.close()
if sys.platform.find("linux") != -1:
  subprocess.call("chmod 600 " + userdir + jobname + ".key", shell=is_shell)
print_output("SSH key named " + jobname + ".key has been downloaded to " + userdir)

# get ssh info
return_output = subprocess.check_output("opai job status -a remote_dev_bed " + jobname +
                                        " ssh", shell=is_shell).decode()
ssh_port = re.findall(r"sshPort: '(.+?)'", return_output)
ssh_ip = re.findall(r"sshIp: (.+?)\n", return_output)
if len(ssh_ip) == 0 or len(ssh_port) == 0:
  print_output("Get SSH IP and Port failed")
else:
  ssh_ip = re.sub("\r", "", ssh_ip[0])
  ssh_port = ssh_port[0]

print_output("SSH IP: " + ssh_ip)
print_output("SSH Port: " + ssh_port)
print_output("SSH Key: " + userdir + jobname + ".key")
print_output("SSH CMD: ssh -i " + userdir + jobname + ".key -p " + ssh_port + " root@" + ssh_ip)
