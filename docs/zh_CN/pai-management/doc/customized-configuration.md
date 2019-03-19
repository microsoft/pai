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

# OpenPAI Configuration Document

### Index

- [Overview](#overview)
- [Step a. How to write layout.yaml](#step_a)
- [Step b. How to write kubernetes-configuration.yaml](#step_b)
- [Step c. How to write service-configuraiton.yaml](#step_c)
- [Step d. How to write k8s-role-definition.yaml](#step_d)

#### Overview <a name="overview"></a>

PAI configuration consists of 4 YAML files:

- [`layout.yaml`](../../../../examples/cluster-configuration/layout.yaml) - 服务器级别配置。 This file contains basic configurations of cluster, such as the login info, machine SKUs, labels of each machine, etc.
- [`kubernetes-configuration.yaml`](../../../../examples/cluster-configuration/kubernetes-configuration.yaml) - Kubernetes-level configurations. This file contains basic configurations of Kubernetes, such as the version info, network configurations, etc.
- [`k8s-role-definition.yaml`](../../../../examples/cluster-configuration/k8s-role-definition.yaml) - Kubernetes-level configurations. This file contains the mappings of Kubernetes roles and machine labels. It will be deprecated in the future.
- [`serivices-configuration.yaml`](../../../../examples/cluster-configuration/services-configuration.yaml) - Service-level configurations. This file contains the definitions of cluster id, docker registry, and those of all individual PAI services.

### Step a. How to write layout.yaml <a name="step_a"></a>

[A Guide of customize layout.yaml](./how-to-configure-layout.md)

### Step b. How to write kubernetes-configuration.yaml <a name="step_b"></a>

[A Guide of customize kubernetes-configuration.yaml](./how-to-configure-k8s-config.md)

### Step c. How to write service-configuration.yaml <a name="step_c"></a>

[A Guide of customize service-configuration.yaml](./how-to-congiure-service-config.md)

### Step d. How to write k8s-role-definition.yaml <a name="step_d"></a>

Please directly copy the example [

    k8s-role-definition.yaml](../../../../examples/cluster-configuration/k8s-role-definition.yaml)'s content.