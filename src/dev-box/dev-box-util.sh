#!/bin/bash

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

pre_config() {
  if [ "$CLUSTER_TYPE" = "AKS" ]; then
    echo "Deploy over AKS, The system starts to do dev-box pre_config"
    # Azure CLI login
    az login
    az account set --subscription "$SUBSCRIPTION_NAME"
    # Get AKS credentials & Config Azure AKS kubectl
    az aks get-credentials --resource-group "$RESOURCE_GROUP" --name "$NAME"
  else
    echo "Not execute pre_config(), Please configure legal variables CLUSTER_TYPE. Optional: \"AKS\""
  fi;
}

# config SSH relasted env for quick start prerequisites
config_ssh() {
  if [ "$CLUSTER_TYPE" = "AKS" ]; then 
    echo "Deploy over AKS, The system starts to configure SSH"  
    for i in `az vm list-ip-addresses --resource-group $NODE_RESOURCE_GROUP -o table`;
      do
        if [[ $i =~ aks-agentpool* ]]; then
          # change password for nodes
          az vm user update -u "$SSH_USERNAME" -p "$SSH_PASSWORD" -n $i -g $NODE_RESOURCE_GROUP
          echo "change password for node $i finished"
          # deploy a jumpbox dev-box in k8s for ssh
          if ! kubectl get pods | grep -q "dev-box"; then
            kubectl label nodes $i dev-box=true
            kubectl apply -f deploy/dev-box-k8s-deploy.yaml
            echo "label and deploy dev-box-aks pods at node $i finished"
          fi
        fi
    done
  else
    echo "Not execute config_ssh(), Please configure legal variables CLUSTER_TYPE. Optional: \"AKS\""  
  fi;
}

# get cluster nodes list for quick start prerequisites
get_nodes_list() {
  if [ "$CLUSTER_TYPE" = "AKS" ]; then
    echo "Deploy over AKS, The system starts to get node list"
    az vm list-ip-addresses --resource-group "$NODE_RESOURCE_GROUP" -o table
  else
    echo "Not execute get_nodes_lsit(), Please configure legal variables CLUSTER_TYPE. Optional: \"AKS\""
  fi;
}

config_dev_box() {
  pre_config
  config_ssh
  get_node_list
}
