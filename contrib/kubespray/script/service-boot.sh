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

OPENPAI_BRANCH_NAME=`cat ${CLUSTER_CONFIG} | grep branch-name | tr -d "[:space:]" | cut -d ':' -f 2`
OPENPAI_IMAGE_TAG=`cat ${CLUSTER_CONFIG} | grep docker-image-tag | tr -d "[:space:]" | cut -d ':' -f 2`

echo "Branch Name ${OPENPAI_BRANCH_NAME}"
echo "OpenPAI Image Tag ${OPENPAI_IMAGE_TAG}"

sudo docker run -itd \
        -e COLUMNS=$COLUMNS -e LINES=$LINES -e TERM=$TERM \
        -e BRANCH_NAME=${OPENPAI_BRANCH_NAME} \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -v ${HOME}/pai-deploy/cluster-cfg:/cluster-configuration  \
        -v ${HOME}/pai-deploy/kube:/root/.kube \
        --pid=host \
        --privileged=true \
        --net=host \
        --name=dev-box-quick-start \
        openpai/dev-box:${OPENPAI_IMAGE_TAG}

sudo docker exec -it dev-box-quick-start kubectl get node

# Work in dev-box
sudo docker exec -i dev-box-quick-start /bin/bash << EOF_DEV_BOX

cd /root

git clone https://github.com/microsoft/pai.git
cd pai

echo "branch name: ${BRANCH_NAME}"

git checkout ${BRANCH_NAME}
git pull

# TODO: This should be done at our source code.
kubectl create namespace pai-storage

# 1. Push cluster config to cluster
echo -e "pai\n" | python paictl.py config push -p /cluster-configuration -m service

# 2. Start OpenPAI service
echo -e "pai\n" | python paictl.py service start
EOF_DEV_BOX

sudo docker stop dev-box-quick-start
sudo docker rm dev-box-quick-start
