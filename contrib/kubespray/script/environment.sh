#!/bin/bash

while getopts "c:" opt; do
  case $opt in
    c)
      CLUSTER_CONFIG=$OPTARG
      ;;
    \?)
      echo "Invalid option: -$OPTARG"
      exit 1
      ;;
  esac
done

echo "Create working folder in ${HOME}/pai-deploy"
mkdir -p ${HOME}/pai-deploy/

echo "Clone kubespray source code from github to ${HOME}/pai-deploy"
sudo rm -rf ${HOME}/pai-deploy/kubespray
git clone -b release-2.11 https://github.com/kubernetes-sigs/kubespray.git ${HOME}/pai-deploy/kubespray

echo "Copy inventory folder, and save it "
cp -rfp ${HOME}/pai-deploy/kubespray/inventory/sample ${HOME}/pai-deploy/kubespray/inventory/pai


echo "Install necessray packages"

echo "Install Python3 and pip"
sudo apt-get -y update
sudo apt-get -y install software-properties-common python3 python3-dev
curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
sudo python3 get-pip.py

echo "Install python packages"
sudo python3 -m pip3 install paramiko # need paramiko for ansible-playbook
sudo pip3 install -r script/requirements.txt

echo "Install sshpass"
sudo apt-get -y install sshpass

echo "Install kubespray's requirements and ansible is included"
sudo python3 -m pip3 install -r ${HOME}/pai-deploy/kubespray/requirements.txt
