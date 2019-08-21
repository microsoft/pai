# AI 开放平台（OpenPAI） ![alt text](./pailogo.jpg "OpenPAI")

[![生成状态](https://travis-ci.org/microsoft/pai.svg?branch=master)](https://travis-ci.org/microsoft/pai) [![代码覆盖状态](https://coveralls.io/repos/github/microsoft/pai/badge.svg?branch=master)](https://coveralls.io/github/microsoft/pai?branch=master) [![进入 https://gitter.im/Microsoft/pai 聊天室提问](https://badges.gitter.im/Microsoft/pai.svg)](https://gitter.im/Microsoft/pai?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge) [![版本](https://img.shields.io/github/release/Microsoft/pai.svg)](https://github.com/Microsoft/pai/releases/latest)

[English](README.md)

OpenPAI 作为开源平台，提供了完整的 AI 模型训练和资源管理能力，能轻松扩展，并支持各种规模的私有部署、云和混合环境。

**OpenPAI [v0.14.0](./RELEASE_NOTE.md#july-2019-version-0140) 已发布！**

## 目录

1. [适用场景](#适用场景)
2. [特点](#特点)
3. [入门](#入门)
4. [部署](#部署)
5. [训练模型](#训练模型)
6. [运维管理](#运维管理)
7. [参考手册](#参考手册)
8. [寻求帮助](#寻求帮助)
9. [参与贡献](#参与贡献)

## 适用场景

1. 在团队间共享强大的 AI 计算资源（例如，GPU、FPGA 集群）。
2. 在组织内共享或重用 AI 资产（如模型、数据、运行环境等) 。
3. 构建易于 IT 运维管理的 AI 计算平台。
4. 在同一个环境中完成模型训练过程。

## 特点

OpenPAI 的设计成熟可靠。在微软的大规模部署中，得到了多年持续运行的验证。

### 易于部署

OpenPAI 是全栈的解决方案。 不仅支持本地、公有云及混合云中的部署，还支持单机试用的部署。

### 支持流行的 AI 框架以及异构的硬件

OpenPAI 提供了预构建的支持主流 AI 框架的 Docker。 支持添加异构硬件。 支持分布式训练, 如分布式 TensorFlow。

### 全栈解决方案、易于扩展

OpenPAI 是支持深度学习、虚拟集群，兼容 Hadoop/Kubernetes 生态系统的完整解决方案。 OpenPAI 支持可扩展组件：可根据需要接入扩展模块。

## 相关项目

聚焦于开放和最前沿的技术，[微软研究院（MSR）](https://www.microsoft.com/en-us/research/group/systems-research-group-asia/)和[微软互联网工程院](https://www.microsoft.com/en-us/ard/company/introduction.aspx)还发布了其它一些开源项目。

* [NNI](https://github.com/Microsoft/nni): 用于神经体系结构搜索和超参数调优的开源 AutoML 工具包。 我们鼓励研究人员和学生利用这些项目来加速 AI 开发和研究。
* [MMdnn](https://github.com/Microsoft/MMdnn)：一个完整、跨框架的解决方案，能够转换、可视化、诊断深度神经网络模型。 MMdnn 中的 "MM" 表示 model management（模型管理），而 "dnn" 是 deep neural network（深度神经网络）的缩写。
* [NeuronBlocks](https://github.com/Microsoft/NeuronBlocks)：面向自然语言理解（NLP）的深度学习建模工具包，帮助工程师像搭建积木一样创建深度神经网络模型。 该工具包可减少自然语言理解建模时的开发成本，对于训练和推理阶段都适用。
* [SPTAG](https://github.com/Microsoft/SPTAG) : Space Partition Tree And Graph (SPTAG) 是用于大规模向量的最近邻搜索场景的开源库。

## 入门

OpenPAI 用于管理计算资源，并对机器学习任务进行了优化。 通过 Docker 技术，硬件计算资源与软件相分离。这样，用户能轻松的进行分布式计算，在不同的深度学习框架间切换，也能在完全一致的环境中重复运行 Job。

作为平台，OpenPAI 需要[部署](#部署)后才能使用。 OpenPAI 也支持单机部署。

部署完成后，可参考[训练模型](#训练模型)。

## 部署

根据以下内容来检查先决条件，部署并验证 OpenPAI 集群。 More servers can be added as needed after initial deployed.

It's highly recommended to try OpenPAI on server(s), which has no usage and service. Refer to [here](https://github.com/Microsoft/pai/wiki/Resource-Requirement) for hardware specification.

### 先决条件和准备工作

* Ubuntu 16.04 (18.04 未经完整测试，或许没问题）。
* 每台服务器都有静态 IP 地址，并确保服务器可以相互通信。
* 确保服务器可以访问互联网，特别是 Docker Hub 或其镜像服务器。 在部署过程中需要拉取 OpenPAI 的 Docker 映像。
* 确保 SSH 服务已启用，所有服务器使用相同的用户名、密码，并启用 sudo 权限。
* 确保 NTP 服务已启用。
* 建议不提前安装 Docker 组件，如果已安装，确保 Docker 版本高于 1.26。
* OpenPAI 会保留部分内存和 CPU 资源来运行服务，须确保服务器有足够的资源来运行机器学习作业。 详情参考[硬件要求](https://github.com/Microsoft/pai/wiki/Resource-Requirement)。
* OpenPAI 的服务器不能提供其它服务。 OpenPAI 会管理服务器的所有 CPU、内存和 GPU 资源。 如果服务器上有其它的服务负载，可能导致资源不足而产生各种问题。

### 部署

The [Deploy with default configuration](#Deploy-with-default-configuration) part is minimum steps to deploy an OpenPAI cluster, and it's suitable for most small and middle size clusters within 50 servers. Base on the default configuration, the customized deployment can optimize the cluster for different hardware environments and use scenarios.

#### 使用默认配置部署

For a small or medium size cluster, which is less than 50 servers, it's recommended to [deploy with default configuration](docs/pai-management/doc/distributed-deploy.md). if there is only one powerful server, refer to [deploy OpenPAI as a single box](docs/pai-management/doc/single-box.md).

For a large size cluster, this section is still needed to generate default configuration, then [customize the deployment](#customize-deployment).

#### 自定义部署

As various hardware environments and different use scenarios, default configuration of OpenPAI may need to be optimized. Following [Customize deployment](docs/pai-management/doc/how-to-generate-cluster-config.md#Optional-Step-3.-Customize-configure-OpenPAI) part to learn more details.

### 验证部署

After deployment, it's recommended to [validate key components of OpenPAI](docs/pai-management/doc/validate-deployment.md) in health status. After validation is success, [submit a hello-world job](docs/user/training.md) and check if it works end-to-end.

### 培训用户

The common practice on OpenPAI is to submit job requests, and wait jobs got computing resource and executed. It's different experience with assigning dedicated servers to each one. People may feel computing resource is not in control and the learning curve may be higher than run job on dedicated servers. But shared resource on OpenPAI can improve utilization of resources and save time on maintaining environments.

For administrators of OpenPAI, a successful deployment is first step, the second step is to let users of OpenPAI understand benefits and know how to use it. Users can learn from [Train models](#train-models). But below section of training models is for various scenarios and maybe users don't need all of them. So, administrators can create simplified documents as users' actual scenarios.

### 常见问答

If there is any question during deployment, check [here](docs/faq.md#deploy-and-maintenance-related-faqs) firstly.

If FAQ doesn't resolve it, refer to [here](#get-involved) to ask question or submit an issue.

## 训练模型

As all computing platforms, OpenPAI is a productive tool and to maximize utilization of resources. So, it's recommended to submit training jobs and let OpenPAI to allocate resource and run jobs. If there are too many jobs, some jobs may be queued until enough resource available. This is different experience with running code on dedicated servers, so it needs a bit more knowledge about how to submit and manage jobs on OpenPAI.

Note, besides queuing jobs, OpenPAI also supports to allocate dedicated resources. Users can use SSH or Jupyter Notebook like on a physical server, refer to [here](examples/jupyter/README.md) for details. Though it's not efficient to use resources, but it also saves cost on setup and managing environments on physical servers.

### 提交训练作业

Follow [the job submission tutorial](docs/user/job_submission.md) to learn more how to train models on OpenPAI. It's a good start to learn How to use OpenPAI.

### 客户端

[OpenPAI VS Code Client](contrib/pai_vscode/VSCodeExt.md) is a friendly, GUI based client tool of OpenPAI, and it's highly recommended. It's an extension of Visual Studio Code. It can submit job, simulate jobs locally, manage multiple OpenPAI environments, and so on.

### 调研 Job 错误

Web UI and job log are helpful to analyze job failure, and OpenPAI supports SSH for debugging.

Refer to [here](docs/user/troubleshooting_job.md) for more information about troubleshooting job failure.

## 运维管理

* [使用 paictl 管理集群](docs/zh_CN/paictl/paictl-manual.md)
* [监测](./docs/zh_CN/webportal/README.md)
* [升级](./docs/zh_CN/upgrade/upgrade_to_v0.13.md)

## 参考手册

### 用户

* [客户端](contrib/pai_vscode/VSCodeExt_zh_CN.md)
* [使用存储](docs/zh_CN/user/storage.md)
* [Job 配置](docs/zh_CN/job_tutorial.md)
* [RESTful API](docs/zh_CN/rest-server/API.md)
* [设计文档](docs)可帮助了解 OpenPAI 的设计和架构。

## 寻求帮助

* [Stack Overflow](./docs/zh_CN/stackoverflow.md)：如果对 OpenPAI 有问题，在 Stack Overflow 网站的标签 openpai 下提交问题。
* [Gitter Chat](https://gitter.im/Microsoft/pai)：也可以在 Gitter 中提问。
* [提交问题或功能请求](https://github.com/Microsoft/pai/issues/new/choose)：如果发现了错误，或有新功能的需求，可提交到 GitHub。

## 参与贡献

### 贡献者许可协议

This project welcomes contributions and suggestions. Most contributions require you to agree to a Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us the rights to use your contribution. For details, visit https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact <opencode@microsoft.com> with any additional questions or comments.

### 征集意见建议

We are working on a set of major features improvement and refactor, anyone who is familiar with the features is encouraged to join the design review and discussion in the corresponding issue ticket.

* OpenPAI 虚拟集群设计。 [Issue 1754](https://github.com/Microsoft/pai/issues/1754)
* OpenPAI 协议设计。 [Issue 2007](https://github.com/Microsoft/pai/issues/2007)

### 考虑为 OpenPAI 做贡献

* 希望添加对其它机器学习或深度学习框架的支持
* 希望 OpenPAI 成为更强大的 AI 平台（例如，支持更多的机器学习流程，超参调优)
* 希望写作教程和博客文章，来展示如何使用 OpenPAI 解决 AI 问题

### 贡献者

One key purpose of PAI is to support the highly diversified requirements from academia and industry. PAI is completely open: it is under the MIT license. This makes PAI particularly attractive to evaluate various research ideas, which include but not limited to the [components](./docs/research_education.md).

PAI operates in an open model. It is initially designed and developed by [Microsoft Research (MSR)](https://www.microsoft.com/en-us/research/group/systems-research-group-asia/) and [Microsoft Search Technology Center (STC)](https://www.microsoft.com/en-us/ard/company/introduction.aspx) platform team. We are glad to have [Peking University](http://eecs.pku.edu.cn/EN/), [Xi'an Jiaotong University](http://www.aiar.xjtu.edu.cn/), [Zhejiang University](http://www.cesc.zju.edu.cn/index_e.htm), and [University of Science and Technology of China](http://eeis.ustc.edu.cn/) join us to develop the platform jointly. Contributions from academia and industry are all highly welcome.