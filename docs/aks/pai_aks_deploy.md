<!--
  Copyright (c) Microsoft Corporation
  All rights reserved.

  MIT License

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
  documentation files (the "Software"), to deal in the Software without restriction, including without limitation
  the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
  to permit persons to whom the Software is furnished to do so, subject to the following conditions:
  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
  BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
-->

# OpenPAI deployment on Azure AKS

This document introduces the detailed procedures to boot up PAI on Azure AKS Cluster.

## Table of contents:
<!-- TOC depthFrom:2 depthTo:3 -->

- [Step 0. Prepare the dev-box](#c-step-0)
- [Step 1. Prepare the quick-start.yaml file](#c-step-1)
- [Step 2. Generate OpenPAI configuration files](#c-step-2)
- [Step 3. Customize configure OpenPAI on AKS](#c-step-3)
- [Step 4. Push cluster configuration into kubernetes, and set cluster-id](#c-step-4)
- [Step 5. Start all PAI services](#c-step-5)

### Step 0. Prepare the dev-box <a name="c-step-0"></a>

##### step 0.1 common prepare the dev-box
Please refer to this [section](../pai-management/doc/cluster-bootup.md#c-step-0) for the customize setting up a dev-box.

#####  step 0.2 additional configuration for AKS 

After performing the previous common prepare the dev-box step, you need to perform the following additional steps:

In order to meet the pre-requirement of quick start (ssh env and get node ip list), user need exeucte this step. These additional configuration are used for Azure CLI login, kubectl config, SSH env config and get node list. 

0.2.1 Configure src/dev-box/config-dev-box.sh 
```bash
# CLUSTER_TYPE: AKS etc.
export CLUSTER_TYPE="AKS" # cluster type: config AKS. 
export SSH_USERNAME="user"  # VM ssh username will be used by set VM SSH config
export SSH_PASSWORD="password" # VM ssh password will be used by set VM SSH config

# AKS config. These are CLUSTER_TYPE related configuration
export SUBSCRIPTION_NAME="PAIAKSTestSubscription" # Azure subscription name
export RESOURCE_GROUP="PAIAKS" # AKS Cluster nodeResourceGroup, This information can be obtained from Azure portal or Azure CLI execute "az aks list
export NAME="PAIAKS" # AKS Cluster name, This information can be obtained from Azure portal or Azure CLI execute "az aks list
export NODE_RESOURCE_GROUP="MC_PAIAKS_PAIAKS_eastus" # AKS Cluster nodeResourceGroup, This information can be obtained from Azure portal or Azure CLI execute "az aks list".
```

0.2.2 Execute config scripts
```bash
cd /pai/src/dev-box
./config-dev-box.sh
```

### Step 1. Prepare the quick-start.yaml file <a name="c-step-1"></a>

Please refer to this [section](../pai-management/doc/cluster-bootup.md#c-step-1) for prepare the quick-start.yaml file.

### Step 2. Generate OpenPAI configuration files <a name="c-step-2"></a>

Please refer to this [section](../pai-management/doc/cluster-bootup.md#c-step-2) for prepare the quick-start.yaml file.

### Step 3. Customize configure OpenPAI on AKS <a name="c-step-3"></a>


### Step 4. Push cluster configuration into kubernetes, and set cluster-id <a name="c-step-4"></a>

Please refer to this [section](../pai-management/doc/cluster-bootup.md#c-step-5) for Push cluster configuration into kubernetes, and set cluster-id.

### Step 5. Start all PAI services <a name="c-step-5"></a>

Please refer to this [section](../pai-management/doc/cluster-bootup.md#c-step-6) for start all PAI services.

