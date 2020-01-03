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
mkdir -p ${HOME}/pai-deploy/
cd ${HOME}/pai-deploy

echo "Clone kubespray source code from github"
git clone https://github.com/kubernetes-sigs/kubespray.git

echo "Checkout to the Release Branch"
git checkout release-2.11

echo "Copy inventory folder, and save it "
cp -rfp ${HOME}/pai-deploy/kubespray/inventory/sample ${HOME}/pai-deploy/kubespray/inventory/pai


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
cd ${HOME}/pai-deploy
git clone https://github.com/microsoft/pai.git
git checkout yuye/quick-start-script

cd ${HOME}/pai-deploy/pai/contrib/kubespray
mkdir ${HOME}/pai-deploy/cluster-cfg
python3 generator.py -m ${MASTER_LIST} -w ${WORKER_LIST} -c ${CLUSTER_CONFIG} -o ${HOME}/pai-deploy/cluster-cfg
cp openpai.yml ${HOME}/pai-deploy/cluster-cfg
cp openpai.yml ${HOME}/pai-deploy/kubespray/inventory/pai/
cp ${HOME}/pai-deploy/cluster-cfg/hosts.yml ${HOME}/pai-deploy/kubespray/inventory/pai/

exit 0

echo "Generate SSH Key"
ssh-keygen -t rsa -f ~/.ssh/id_rsa -P ""

LOCAL_USER=`whoami`
REMOTE_USER=`cat config.yml | grep user | tr -d "[:space:]" | cut -d ':' -f 2`

cp ${HOME}/pai-deploy/pai/contrib/kubespray/quick-start/set-passwordless-ssh.yml.template ${HOME}/pai-deploy/pai/contrib/kubespray/quick-start/set-passwordless-ssh.yml
sed  -i "s/%REMOTE_USER%/${REMOTE_USER}/g" ${HOME}/pai-deploy/pai/contrib/kubespray/quick-start/set-passwordless-ssh.yml
sed  -i "s/%LOCAL_USER%/${LOCAL_USER}/g" ${HOME}/pai-deploy/pai/contrib/kubespray/quick-start/set-passwordless-ssh.yml

ansible-playbook -i ${HOME}/pai-deploy/cluster-cfg/hosts.yml ${HOME}/pai-deploy/pai/contrib/kubespray/quick-start/set-passwordless-ssh.yml

echo "Install nvidia drivers to the machine"
ansible-playbook -i ${HOME}/pai-deploy/cluster-cfg/gpu-hosts.yml nvidia-drivers.yml --become --become-user=root

echo "Enable nvidia persistent mode"
ansible-playbook -i ${HOME}/pai-deploy/cluster-cfg/gpu-hosts.yml nvidia-persistent-mode.yml --become --become-user=root

echo "Install nvidia docker runtime"
ansible-playbook -i ${HOME}/pai-deploy/cluster-cfg/gpu-hosts.yml nvidia-docker.yml --become --become-user=root

echo "Copy docker configuration"
ansible-playbook -i ${HOME}/pai-deploy/cluster-cfg/gpu-hosts.yml copy-daemon-openpai.yml --become --become-user=root
echo "Setup cluster environment is done"

echo "setup k8s cluster"
cd ${HOME}/pai-deploy/kubespray
ansible-playbook -i inventory/pai/hosts.yml cluster.yml --become --become-user=root -e "@inventory/pai/openpai.yml"
