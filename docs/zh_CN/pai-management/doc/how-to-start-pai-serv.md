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

## Start OpenPAI service

### command

[When Kubernetes is up and running](./how-to-bootup-k8s.md#ref_check), PAI services can then be deployed to it using `paictl` tool:

```bash
cd pai

# cmd should be executed under /pai directory in the environment.

python paictl.py service start \
  [ -c ~/.kube/config] \
  [ -n service-list ]
```

If the `-n` parameter is specified, only the given services, e.g. `rest-server`, `webportal`, `watchdog`, etc., will be deployed. If not, all PAI services will be deployed. In the latter case, the above command does the following things:

- Generate Kubernetes-related configuration files based on `layout.yaml`.

- Use `kubectl` to set up config maps and create pods on Kubernetes.

### How to check

After this step, the system maintainer can check the status of OpenPAI services by accessing OpenPAI kubernetes web portal:

```bash
http://<master>:9090/#!/pod?namespace=default
```