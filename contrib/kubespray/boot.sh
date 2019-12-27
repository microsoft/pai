#!/bin/bash

while getopts "w:m:c:" opt; do
  case $opt in
    w)
      WORKER_LIST=$OPTARG
      ;;
    m)
      MASTER_LIST=$OPTARG
      ;;
    c)
      CLUSTER_CONFIG=$OPTARG
      ;;
    \?)
      echo "Invalid option: -$OPTARG"
      exit 1
      ;;
  esac
done

echo "worker list file path: ${WORKER_LIST}"
echo "master list file path: ${MASTER_LIST}"
echo "cluster config file path: ${CLUSTER_CONFIG}"

if [ ! -f "${WORKER_LIST}" ]
then
  echo "Error: Can't find worker list file in the path ${WORKER_LIST}！"
  exit 1
fi

if [ ! -f "${MASTER_LIST}" ]
then
  echo "Error: Can't find master list file in the path ${MASTER_LIST}！"
  exit 1
fi

if [ ! -f "${CLUSTER_CONFIG}" ]
then
  echo "Error: Can't find master list file in the path ${CLUSTER_CONFIG}！"
  exit 1
fi

echo "Create working folder in ${HOME}/pai-deploy"
mkdir -p ~/pai-deploy/
cd ${HOME}/pai-deploy

echo "Clone kubespray source code from github"
git clone https://github.com/kubernetes-sigs/kubespray.git

echo "Checkout to the Release Branch"
git checkout release-2.11

echo "Install necessray packages"

echo "Install Python3 and pip"
sudo apt-get -y update
sudo apt-get -y install software-properties-common python3 python3-dev
curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
sudo python3 get-pip.py

echo "Install paramiko"
sudo pip3 install paramiko

echo "Install kubespray's requirements and ansible is included"
cd ${HOME}/pai-deploy/kubespray
sudo pip3 install -r requirements.txt

echo "Clone OpenPAI source code from github"
git clone https://github.com/microsoft/pai.git

echo "Checkout to the release branch "
cd ${HOME}/pai-deploy/pai/contrib/kubespray/quick-start
mkdir ${HOME}/pai-deploy/cluster-cfg
python3 generator.py -m ${MASTER_LIST} -w ${WORKER_LIST} -c ${CLUSTER_CONFIG} -o ${HOME}/pai-deploy/cluster-cfg

echo "Generate SSH Key"
ssh-keygen -t rsa -f ~/.ssh/id_rsa -P ""

CURRENT_USER=`whoami`
REMOTE_USER=`cat config.yml | grep user | tr -d "[:space:]" | cut -d ':' -f 2`



