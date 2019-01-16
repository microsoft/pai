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


### AKS K8S cluster cluster

AKS's k8s cluster has the following characteristics, affecting our targeted deployment configuration items.

- The default node operating system disk is small (Step 0 "Precautions" part is related to this item)
- The cluster node has only intranet IP by default. (Step 0 "Precautions" part is related to this item)
- Cluster's service pod access to K8S api-server requires authentication (Step 3 "Precautions" part is related to this item)
- K8s dashboard pod is not deployed on user-created nodes (Step 3 "Precautions" part is related to this item)
- api-server pod is not deployed on user-created nodes (Step 3 is "Precautions" part related to this item)

### Deployment Steps
- [Step 0. Prepare an AKS cluster](#c-step-0)
- [Step 1. Prepare Deployment Environment](#c-step-1)
- [Step 2. Prepare configuration](#c-step-2)
- [Step 3. Update cluster configuration into kubernetes](#c-step-4)
- [Step 4. Start all OpenPAI services](#c-step-5)
- [appendix. Validate deployment](#appendix)

***

### Step 0. Prepare an AKS cluster <a name="c-step-0"></a>

Users can refer to the AKS official documentation to [deploy an AKS cluster through the Azure CLI](https://docs.microsoft.com/en-us/azure/aks/kubernetes-walkthrough#create-aks-cluster).

***Precautions***:

- Use the ***az aks create*** command to create an AKS cluster. Configure the node os disk through the configuration item ***--node-osdisk-size to*** have large disk space. 

- Admin could open the OpenPAI homepage to the external network users through [Azure load balancer and service](https://docs.microsoft.com/en-us/azure/aks/static-ip). Redirect public ip to port 80 (default is OpenPAI master node 80 port)

OpenPAI main page port config item at services-configuration.yaml:

```
cluster:
  pylon:
    port: 80
```

### Step 1. Prepare Deployment Environment <a name="c-step-1"></a>

Step 1.1 Prepare deployment related dependency.

- [Option A. Start Dev-box contianer as the environemnt.](./how-to-setup-dev-box.md) 
- [Option B. Install necessary dependency software on your host.](./how-to-install-depdencey.md)

Note 1: If you wanna manage the cluster in a machine belonging to OpenPAI, please choose option B. Otherwise, option A is highly recommended.

Step 1.2 [Prepare kubectl over your deployment environment](https://docs.microsoft.com/en-us/azure/aks/kubernetes-walkthrough#connect-to-the-cluster).

***

### Step 2. Prepare Configuraiton <a name="c-step-2"></a>

- [Option A. Generate the Cluster Configuration from template](./how-to-generate-cluster-config.md)
- [Option B. Write your own Cluster Configuration](./customized-configuration.md)

If this the first time for you to deploy OpenPAI, Option A is highly recommended. 

If you wanna customize the configuration, you could firstly follow the Option A to generate a rough cluster configuration. And then you can follow Option B to customize your configuration according to your requirements.

If you are very familiar with OpenPAI, you could directly write your configuraiton based on the Option B.

***Precautions***:

- (1) api-server access ip & authentication configuration item：
  
config items at kubernetes-configuration.yaml:

```
layout:
  kubernetes:
    api-servers-url: http://10.1.0.6
    serviceaccount_token_path: /var/run/secrets/kubernetes.io/serviceaccount/
```

How to get:

```
kubectl cluster-info
```

- (2) K8S dashboard IP address:

config items at kubernetes-configuration.yaml:

```
layout:
  kubernetes:
    load-balance-ip: http://10.1.0.5
```

How to get:
```
kubectl get pods -n kube-system | grep dashboard
```
output: kubernetes-dashboard-5c4896df4-wnvvm   1/1     Running   5          5d18h
```
kubectl describe pods kubernetes-dashboard-5c4896df4-wnvvm -n kube-system | grep IP
```
***

### Step 4. Update cluster configuration into kubernetes <a name="c-step-4"></a>

- [A Guide to update configuration](./push-cfg-and-set-id.md)

***

### Step 5. Start all OpenPAI services <a name="c-step-5"></a>

- [A Guide to start OpenPAI services](./how-to-start-pai-serv.md)


***

### appendix. Validate deployment <a name="appendix"></a>

- [A Guide to validate deployment](./validate-deployment.md)



