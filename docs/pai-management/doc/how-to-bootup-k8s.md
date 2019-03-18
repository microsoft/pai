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


## Deploy kubernetes cluster with OpenPAI


#### Prerequires

Before deploying kubernete with OpenPAI, please be sure that your hardware and os meet the requirement in the [link](../../../README.md#prerequisites)


#### Command

```bash
cd pai

python paictl.py cluster k8s-bootup \
  -p ~/pai-config
```

The `paictl` tool does the following things:

- Install `kubectl` command in the current machine (or the dev-box).

- Generate Kubernetes-related configuration files based on `layout.yaml`, `kubernetes-configuration.yaml` and `k8s-role-definition.yaml`.

- Use `kubectl` to boot up Kubernetes on target machines.


#### How to check <a name="ref_check"></a>

After this step, the system maintainer can check the status of Kubernetes by accessing Kubernetes Dashboard:

```
http://<master>:9090
```

Where `<master>` denotes the IP address of the load balancer of Kubernetes master nodes. When there is only one master node and a load balancer is not used, it is usually the IP address of the master node itself.


#### Help
- [Kubernetes Deployment Q&A](./kubernetes-deploy-qna.md)
- [paictl manual book](./../../paictl/paictl-manual.md)