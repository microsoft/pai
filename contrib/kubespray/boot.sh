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
cd kubespray
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

echo "Install sshpass"
sudo apt-get -y install sshpass

echo "Install kubespray's requirements and ansible is included"
cd ${HOME}/pai-deploy/kubespray
sudo pip3 install -r requirements.txt

echo "Clone OpenPAI source code from github"
cd ${HOME}/pai-deploy
git clone https://github.com/microsoft/pai.git
cd pai
git checkout yuye/quick-start-script

cd ${HOME}/pai-deploy/pai/contrib/kubespray
mkdir ${HOME}/pai-deploy/cluster-cfg
python3 quick-start/generator.py -m ${MASTER_LIST} -w ${WORKER_LIST} -c ${CLUSTER_CONFIG} -o ${HOME}/pai-deploy/cluster-cfg
cp openpai.yml ${HOME}/pai-deploy/cluster-cfg
cp openpai.yml ${HOME}/pai-deploy/kubespray/inventory/pai/
cp ${HOME}/pai-deploy/cluster-cfg/hosts.yml ${HOME}/pai-deploy/kubespray/inventory/pai/

echo "Generate SSH Key"

rm -rf ${HOME}/.ssh/known_hosts

ssh-keygen -t rsa -f ~/.ssh/id_rsa -P ""

LOCAL_USER=`whoami`
REMOTE_USER=`cat ${CLUSTER_CONFIG} | grep user | tr -d "[:space:]" | cut -d ':' -f 2`

cp ${HOME}/pai-deploy/pai/contrib/kubespray/quick-start/set-passwordless-ssh.yml.template ${HOME}/pai-deploy/pai/contrib/kubespray/quick-start/set-passwordless-ssh.yml
sed  -i "s/%REMOTE_USER%/${REMOTE_USER}/g" ${HOME}/pai-deploy/pai/contrib/kubespray/quick-start/set-passwordless-ssh.yml
sed  -i "s/%LOCAL_USER%/${LOCAL_USER}/g" ${HOME}/pai-deploy/pai/contrib/kubespray/quick-start/set-passwordless-ssh.yml

ansible-playbook -i ${HOME}/pai-deploy/cluster-cfg/hosts.yml ${HOME}/pai-deploy/pai/contrib/kubespray/quick-start/set-passwordless-ssh.yml

echo "Ping Test"

ansible all -i ${HOME}/pai-deploy/cluster-cfg/hosts.yml -m ping || exit $?

echo "Install nvidia drivers to the machine"
ansible-playbook -i ${HOME}/pai-deploy/cluster-cfg/gpu-hosts.yml nvidia-drivers.yml --become --become-user=root || exit $?

echo "Enable nvidia persistent mode"
ansible-playbook -i ${HOME}/pai-deploy/cluster-cfg/gpu-hosts.yml nvidia-persistent-mode.yml --become --become-user=root || exit $?

echo "Install nvidia docker runtime"
ansible-playbook -i ${HOME}/pai-deploy/cluster-cfg/gpu-hosts.yml nvidia-docker.yml --become --become-user=root || exit $?

echo "Copy docker configuration into infra (master) node"
ansible-playbook -i ${HOME}/pai-deploy/cluster-cfg/infra-hosts.yml copy-daemon-openpai-default-runtime.yml --become --become-user=root || exit $?

echo "Copy docker configuration into GPU (worker) node"
ansible-playbook -i ${HOME}/pai-deploy/cluster-cfg/gpu-hosts.yml copy-daemon-openpai-nvidia-runtime.yml --become --become-user=root || exit $?

echo "Setup cluster environment is done"

echo "setup k8s cluster"
cd ${HOME}/pai-deploy/kubespray
ansible-playbook -i inventory/pai/hosts.yml cluster.yml --become --become-user=root -e "@inventory/pai/openpai.yml" || exit $?

echo "K8s is setup"
echo "Starting dev-box on your local host"

echo "Install docker ce"

mkdir -p ${HOME}/pai-deploy/kube
cp -rf ${HOME}/pai-deploy/kubespray/inventory/pai/artifacts/admin.conf ${HOME}/pai-deploy/kube/config

sudo docker run -itd \
        -e COLUMNS=$COLUMNS -e LINES=$LINES -e TERM=$TERM \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -v ${HOME}/pai-deploy/cluster-cfg:/cluster-configuration  \
        -v ${HOME}/pai-deploy/kube:/root/.kube \
        --pid=host \
        --privileged=true \
        --net=host \
        --name=dev-box-quick-start \
        openpai/dev-box:quick-start

sudo docker exec -it dev-box-quick-start kubectl get node

# Work in dev-box
sudo docker exec -i dev-box-quick-start /bin/bash << EOF_DEV_BOX
cd /pai

rm -f ./.git/index.lock

git checkout master
git pull

# TODO: This should be done at our source code.
kubectl create namespace pai-storage

# 1. Push cluster config to cluster
echo -e "pai\n" | python paictl.py config push -p /cluster-configuration -m service

# 2. Start OpenPAI service
echo -e "pai\n" | python paictl.py service start
EOF_DEV_BOX
