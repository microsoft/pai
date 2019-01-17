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

- [Prepare an AKS cluster best practice](#c-step-1)
- [OpenPAI Deployment on AKS Steps](#c-step-02)

### Prepare an AKS cluster for OpenPAI best practice<a name="a-step-1"></a>

Users can refer to the AKS official documentation to [deploy an AKS cluster through the Azure CLI](https://docs.microsoft.com/en-us/azure/aks/kubernetes-walkthrough#create-aks-cluster).

***Precautions***:

- Use the ***az aks create*** command to create an AKS cluster. Configure the node os disk through the configuration item ***--node-osdisk-size to*** have large disk space. 

- Admin could open the OpenPAI homepage to the external network users through [Azure load balancer and service](https://docs.microsoft.com/en-us/azure/aks/static-ip). Redirect public ip to port 80 (default is OpenPAI entry page default 80 port)

For [this step](https://docs.microsoft.com/en-us/azure/aks/static-ip#create-a-service-using-the-static-ip-address): your k8s service load balancer config to select app pylon.

```
spec:
  selector:
    app: pylon
```



### OpenPAI Deployment on AKS Steps <a name="a-step-2"></a>
- [Step 1. Prepare Deployment Environment](#c-step-1)
- [Step 2. Prepare configuration](#c-step-2)
- [Step 3. Update cluster configuration into kubernetes](#c-step-4)
- [Step 4. Start all OpenPAI services](#c-step-5)
- [appendix. Validate deployment](#appendix)

***


### Step 1. Prepare Deployment Environment <a name="c-step-1"></a>

Prepare deployment related dependency.

- [Option A. Start Dev-box contianer as the environemnt.](./how-to-setup-dev-box.md) 
- [Option B. Install necessary dependency software on your host.](./how-to-install-depdencey.md)

Note 1: If you wanna manage the cluster in a machine belonging to OpenPAI, please choose option B. Otherwise, option A is highly recommended.

***Precautions***:

- [Prepare kubectl over your deployment environment](https://docs.microsoft.com/en-us/azure/aks/kubernetes-walkthrough#connect-to-the-cluster).

***

### Step 2. Prepare Configuraiton <a name="c-step-2"></a>

- Step 2.1 generate layout.yaml

```
python paictl.py layout
```

output folder and layout.yaml file are at /cluster-configuration.

- Step 2.2 customize configuration 

copy or prepare a [service-configuration.yaml](https://github.com/Microsoft/pai/blob/master/deployment/quick-start/services-configuration.yaml.template) under /cluster-configuration. Please fill in the docker docker-registry content. 

```
cluster:
  docker-registry:
```

***Precautions***:

- config K8S dashboard IP address:

How to get dashboard IP: Pod in kube-system namespace, user can get ip through "kubectl describe pod podname -n namespace"

config items at layout.yaml:

```
layout:
  kubernetes:
    dashboard-host: 10.1.0.5
```



### Step 4. Update cluster configuration into kubernetes <a name="c-step-4"></a>

- [A Guide to update configuration](./push-cfg-and-set-id.md)

***

### Step 5. Start all OpenPAI services <a name="c-step-5"></a>

- [A Guide to start OpenPAI services](./how-to-start-pai-serv.md)


***

### appendix. Validate deployment <a name="appendix"></a>

- [A Guide to validate deployment](./validate-deployment.md)

