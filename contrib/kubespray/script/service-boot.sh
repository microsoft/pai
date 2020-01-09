#!/bin/bash

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

cd /root

git clone https://github.com/microsoft/pai.git
cd pai
git checkout master
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
