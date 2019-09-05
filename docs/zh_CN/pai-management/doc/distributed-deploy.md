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

## 集群部署

### 目录

- [Step 1. 准备部署环境](#c-step-1)
- [Step 2. 生成配置文件](#c-step-2)
- [Step 3. 部署 Kubernetes](#c-step-3)
- [Step 4. 更新 Kubernetes 集群配置](#c-step-4)
- [Step 5. 启动 OpenPAI 服务](#c-step-5)
- [附. 检查部署](#appendix)
- [附. Azure RDMA](#az_rdma)

* * *

### Step 1. 准备部署环境 <a name="c-step-1"></a>

- [Option A. 使用 Dev-box 容器作为部署环境.](./how-to-setup-dev-box.md)
- [Option B. 在集群节点上准备部署环境，需先安装依赖的组件](./how-to-install-depdencey.md)

note 1: 一般推荐使用A方式，如果使用OpenPAI节点来管理集群，请选择B。

* * *

### Step 2. 生成配置文件 <a name="c-step-2"></a>

- [Option A. 从模板生成集群配置文件](./how-to-generate-cluster-config.md)
- [Option B. 编写自定义配置](./customized-configuration.md)

首次部署，推荐使用 A 方式。

如果需要自定义配置，也推荐先从模板生成，然后根据需要修改。

如果对OpenPAI非常熟悉，也可以直接编写配置文件。

* * *

### Step 3. 部署 Kubernetes <a name="c-step-3"></a>

如果是在 Azure 上部署，并且支持 rdma. 请参见 [section](#az_rdma) 。

- [开始使用paictl部署Kubernetes](./how-to-bootup-k8s.md)

* * *

### Step 4. 更新 Kubernetes 集群配置<a name="c-step-4"></a>

- [如何更新集群配置](./push-cfg-and-set-id.md)

* * *

### Step 5. 启动 OpenPAI 服务 <a name="c-step-5"></a>

- [如何启动 OpenPAI 服务](./how-to-start-pai-serv.md)

* * *

### 附. 检查集群配置 <a name="appendix"></a>

- [如何检查集群配置](./validate-deployment.md)

* * *

### 附. Azure RDMA <a name="az_rdma"></a>

- [如何使用 Azure RDMA](./azure/enable-az-rdma.md)
