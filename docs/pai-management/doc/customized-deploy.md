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

## Customized deploy 

### Index
- [Step 1. Prepare Deployment Environment](#c-step-1)
- [Step 2. Prepare configuration](#c-step-2)
- [Step 3. Boot up Kubernetes](#c-step-3)
- [Step 4. Push cluster configuration into kubernetes, and set cluster-id](#c-step-4)
- [Step 5. Start all OpenPAI services](#c-step-5)
- [Step 6. Validate deployment](#c-step-6)

***

### Step 1. Prepare Deployment Environment <a name="c-step-1"></a>

- [Option A. Start Dev-box contianer as the environemnt.](#dev_box) 
- [Option B. Install necessary dependency software on your host.](#install)

Note 1: If you wanna manage the cluster in a machine belonging to OpenPAI, please choose option B. Otherwise, option A is highly recommended.


##### ```A. Starting Dev-box container as the environment``` <a name="dev_box"></a>

- [A Guide to Setup Dev-Box](./how-to-setup-dev-box.md)

##### ```B. Install necessary dependency software on your host``` <a name="install"></a>

- [A Guide to install dependency on local host](./how-to-install-depdencey.md)

***

### Step 2. Prepare Configuraiton <a name="c-step-2"></a>

- [Option A. Generate the Cluster Configuration from template](#opt_a)
- [Option B. Write your own Cluster Configuration](#opt_b)


##### ```A. Generate cluster configuration from template``` <a name="opt_a"></a>

- [A guide to generate cluster configuration from template](./how-to-generate-cluster-config.md)

##### ```B. Write your own Cluster Configuration``` <a name="opt_b"></a>

- [A guide to write cluster configuration](./customized-configuration.md)

***

### Step 3. Boot up Kubernetes <a name="c-step-3"></a>

- [A Guide to deploy kubenretes with paictl](./how-to-bootup-k8s.md)

***

### Step 4. Push cluster configuration into kubernetes, and set cluster-id <a name="c-step-4"></a>

- [A Guide to push configuration and set id](./push-cfg-and-set-id.md)

***

### Step 5. Start all OpenPAI services <a name="c-step-5"></a>

- [A Guide to start OpenPAI services](./how-to-start-pai-serv.md)


***

### Step 6. Validate deployment <a name="c-step-6"></a>

- [A Guide to validate deployment](./validate-deployment.md)

***


