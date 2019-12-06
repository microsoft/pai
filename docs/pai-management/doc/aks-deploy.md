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

## OpenPAI deploy on AKS

The purpose of this document is to enable users to deploy OpenPAI on a cluster of Azure AKS.

## Table of contents
- [1. Prepare or adapt an AKS cluster for OpenPAI precautions](#c-step-1)
- [2. OpenPAI Deployment on AKS Steps](#c-step-02)

### 1. Prepare or adapt an AKS cluster for OpenPAI precautions<a name="a-step-1"></a>



There are two situations in which a user's AKS cluster can be ***[built from scratch](https://docs.microsoft.com/en-us/azure/aks/kubernetes-walkthrough#create-aks-cluster)*** and ***existing clusters***. For clusters in different situations, we summarized some ***Precautions*** (affect the service function being deployed) and ***Recommended considerations*** before and during deployment.

***Precautions***:
- For api-server RBAC:
  - When deploy AKS from scratch: Disable api-server RBAC when create cluster by param ["--disable-rbac"](https://docs.microsoft.com/en-us/cli/azure/aks?view=azure-cli-latest#az-aks-create).
  -  When use existing enabled RBAC AKS cluster: OpenPAI service pod will be mounted default service account. User could [create role binding refer aks doc](https://docs.microsoft.com/en-us/azure/aks/kubernetes-dashboard#for-rbac-enabled-clusters) to"default:default" [service account](https://kubernetes.io/docs/reference/access-authn-authz/rbac/#service-account-permissions) and "kube-system:k8s-dashboard" service account. As OpenPAI service restserver / prometheus etc & k8s dashboard will access api-server.

***Recommended considerations***:
- For node disk:
  - When deploy AKS from scratch: Use the ***az aks create*** command to create an AKS cluster. Configure the node os disk through the configuration item ***--node-osdisk-size to*** have large disk space. It is better > 500GB.
  - When user existing AKS cluster: If the disk is small, the user can mount a larger disk through the AKS VM and change the disk path "data-path: "/datastorage" item in service-configuration.yaml used by the PAI service to a larger disk in step-3 below.



### 2. OpenPAI Deployment on AKS Steps <a name="a-step-2"></a>
- [Step 1. Prepare Deployment Environment](#c-step-1)
- [Step 2. Prepare configuration](#c-step-2)
- [Step 3. Update cluster configuration into kubernetes](#c-step-3)
- [Step 4. Start all OpenPAI services](#c-step-4)
- [Other considerations and configurations](#c-step-5)
- [appendix. Validate deployment](#appendix)

***


### Step 1. Prepare Deployment Environment <a name="c-step-1"></a>

- Step 1.1. [A guide to prepare deployment env](./prepare_dev_env.md)

- Step 1.2. Prepare kubectl for AKS env

  - 1.2.1 [install Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli-apt?view=azure-cli-latest).

  - 1.2.2 [config kubectl](https://docs.microsoft.com/en-us/azure/aks/kubernetes-walkthrough#connect-to-the-cluster)

To manage a Kubernetes cluster, you use kubectl, the Kubernetes command-line client. If you use Azure Cloud Shell, kubectl is already installed. To install kubectl locally, use the az aks install-cli command:
```
az aks install-cli
```

To configure kubectl to connect to your Kubernetes cluster, use the az aks get-credentials command. This command downloads credentials and configures the Kubernetes CLI to use them. User could get "myResourceGroup", "myAKSCluster" from your Azure portal or Azure CLI.

```
az aks get-credentials --resource-group myResourceGroup --name myAKSCluster
```

output logs:

Merged "myAKSCluster" as current context in /root/.kube/config

***

### Step 2. Prepare Configuration <a name="c-step-2"></a>

- [A guide to generate layout](./generate_layout.md)

***

### Step 3. Update cluster configuration into kubernetes <a name="c-step-3"></a>

- [A guide to update configuration](./push-cfg-and-set-id.md)

***

### Step 4. Start all OpenPAI services <a name="c-step-4"></a>

- [A guide to start OpenPAI services](./how-to-start-pai-serv.md)


***

### Other considerations and configurations <a name="c-step-5"></a>

- Expose OpenPAI mainpage

Admin could open the OpenPAI homepage to the external network users through [Azure load balancer and service](https://docs.microsoft.com/en-us/azure/aks/static-ip). Redirect public ip to port 80 (default is OpenPAI entry page default 80 port)

For [this step](https://docs.microsoft.com/en-us/azure/aks/static-ip#create-a-service-using-the-static-ip-address): update k8s service load balancer yaml config to use app: pylon as selector.

```
spec:
  selector:
    app: pylon
```

- OpenPAI master use GPU node

Normally we recommend use the cpu node to deploy the Open master. But AKS [Multi node pooling functionality is not yet supported](https://feedback.azure.com/forums/914020-azure-kubernetes-service-aks/suggestions/34917127-support-multiple-node-pool). The default OpenPAI on AKS will use the GPU node as the master. The master node will not schedule jobs, and the master node GPU will not be used.


### appendix. Validate deployment <a name="appendix"></a>

- [A guide to validate deployment](./validate-deployment.md)
