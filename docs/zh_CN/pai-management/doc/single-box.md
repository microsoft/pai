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

## Single Box Deploy

### Index

- [Step 1. Prepare Deployment Environment](#c-step-1)
- [Step 2. Prepare configuration](#c-step-2)
- [Step 3. Boot up Kubernetes](#c-step-3)
- [Step 4. Update cluster configuration into kubernetes](#c-step-4)
- [Step 5. Start all OpenPAI services](#c-step-5)
- [appendix. Validate deployment](#appendix)

* * *

### Step 1. Prepare Deployment Environment <a name="c-step-1"></a>

- [A Guide to install dependency on local host](./how-to-install-depdencey.md)

* * *

### Step 2. Prepare Configuration <a name="c-step-2"></a>

- [Option A. Generate the Cluster Configuration from template](./how-to-generate-cluster-config.md)
- [Option B. Write your own Cluster Configuration](./customized-configuration.md)

If this the first time for you to deploy OpenPAI, Option A is highly recommended.

If you wanna customize the configuration, you could firstly follow the Option A to generate a rough cluster configuration. And then you can follow Option B to customize your configuration according to your requirements.

If you are very familiar with OpenPAI, you could directly write your configuration based on the Option B.

* * *

### Step 3. Deploy Kubernetes <a name="c-step-3"></a>

- [A Guide to deploy kubenretes with paictl](./how-to-bootup-k8s.md)

* * *

### Step 4. Update cluster configuration into kubernetes<a name="c-step-4"></a>

- [A Guide to update configuration](./push-cfg-and-set-id.md)

* * *

### Step 5. Start all OpenPAI services <a name="c-step-5"></a>

- [A Guide to start OpenPAI services](./how-to-start-pai-serv.md)

* * *

### Step 6. Validate deployment <a name="appendix"></a>

- [A Guide to validate deployment](./validate-deployment.md)

* * *