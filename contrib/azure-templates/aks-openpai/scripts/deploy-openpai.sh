#!/bin/bash

curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
curl -sL https://get.docker.com | sudo sh

#az login --service-principal --username x --password x --tenant x
#az aks get-credentials --name x --resource-group x --subscription x
sudo docker run \
    -it -d --name=dev-box --privileged --net=host --ipc=host
    -v ${HOME}/.kube:/root/.kube openpai/dev-box:v1.3.0 bash
