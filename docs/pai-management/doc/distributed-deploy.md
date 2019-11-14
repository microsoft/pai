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

## Distributed deploy

### Index
- [Step 1. Prepare Deployment Environment](#c-step-1)
- [Step 2. Prepare Configuration](#c-step-2)
- [Step 3. Deploy Kubernetes](#c-step-3)
- [Step 4. Update cluster configuration into Kubernetes](#c-step-4)
- [Step 5. Start all OpenPAI services](#c-step-5)
- [Appendix. Validate deployment](#appendix)
- [Appendix. Azure RDMA](#az_rdma)

***

### Step 1. Prepare Deployment Environment <a name="c-step-1"></a>

- [Option A. Start Dev-box contianer as the environment.](./how-to-setup-dev-box.md)
- [Option B. Install necessary dependency software on your host.](./how-to-install-depdencey.md)

Note 1: If you wanna manage the cluster in a machine belonging to OpenPAI, please choose Option B. Otherwise, Option A is highly recommended.

Note 2: We suggest the Option A. Because manage cluster in a node of the cluster is not recommanded.

***

### Step 2. Prepare Configuration <a name="c-step-2"></a>

- [Option A. Generate the Cluster Configuration from template](./how-to-generate-cluster-config.md)
- [Option B. Write your own Cluster Configuration](./customized-configuration.md)

If this is the first time for you to deploy OpenPAI, Option A is highly recommended.

If you wanna customize the configuration, you could firstly follow the Option A to generate a rough cluster configuration. And then you can follow Option B to customize your configuration according to your requirements.

If you are very familiar with OpenPAI, you could directly write your configuration based on the Option B.

***

### Step 3. Deploy Kubernetes <a name="c-step-3"></a>

If your cluster is deployed in Azure, and there are azure rdma capable machines. Please go to this [section](#az_rdma) first.

Suggest to deploy kubernetes and maintain it with [kubespray](https://github.com/kubernetes-sigs/kubespray). We have written a document for user to deploy a k8s cluster. And when deploy k8s through this way, please choose an VM which is not belong to the cluster.
 - [Deploy kubernetes with Kubespray](./../../../contrib/kubespray/readme.md) 


Of course, you could deploy kubernetes through paictl. But the kubernetes doesn't have rbac and tls. And due to its risk, deploying k8s with kubespray is highly recommanded.

- [A Guide to deploy Kubernetes with paictl](./how-to-bootup-k8s.md)

***

### Step 4. Update cluster configuration into Kubernetes <a name="c-step-4"></a>

- [A Guide to update configuration](./push-cfg-and-set-id.md)

***

### Step 5. Start all OpenPAI services <a name="c-step-5"></a>

- [A Guide to start OpenPAI services](./how-to-start-pai-serv.md)


***

### Appendix. Validate deployment <a name="appendix"></a>

- [A Guide to validate deployment](./validate-deployment.md)

***


### Appendix. Azure RDMA <a name="az_rdma"></a>

- [A Guide to Enable Azure RDMA](./azure/enable-az-rdma.md)