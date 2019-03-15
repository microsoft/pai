# AI 开放平台（OpenPAI） ![alt text](./pailogo.jpg "OpenPAI")

[![Build Status](https://travis-ci.org/Microsoft/pai.svg?branch=master)](https://travis-ci.org/Microsoft/pai) [![Coverage Status](https://coveralls.io/repos/github/Microsoft/pai/badge.svg?branch=master)](https://coveralls.io/github/Microsoft/pai?branch=master) [![Join the chat at https://gitter.im/Microsoft/pai](https://badges.gitter.im/Microsoft/pai.svg)](https://gitter.im/Microsoft/pai?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge) [![Version](https://img.shields.io/github/release/Microsoft/pai.svg)](https://github.com/Microsoft/pai/releases/latest)

OpenPAI：作为开源平台，提供了完整的 AI 模型训练和资源管理能力，能轻松扩展，并支持各种规模的私有部署、云和混合环境。

## 目录

1. [OpenPAI 适用场景](#when-to-consider-openpai)
2. [OpenPAI 的特点](#why-choose-openpai)
3. [开始使用](#get-started)
4. [部署 OpenPAI](#deploy-openpai)
5. [训练模型](#train-models)
6. [管理](#administration)
7. [参考](#reference)
8. [寻求帮助](#get-involved)
9. [如何做出贡献](#how-to-contribute)

## OpenPAI 适用场景

1. 当你的机构需要在团队之间共享强大的 AI 计算资源 (例如，GPU/FPGA 集群 ) 时。
2. 当你的组织需要共享和重用常见的 AI 资产 (如模型、数据、工作环境等) 时。
3. 当您的组织需要一个简单的 IT 服务平台服务于各种 AI 需求时。
4. 当你想要在一个安全的环境运行一套完整的 AI 训练流程时。

## OpenPAI 的特点

该平台采用了成熟的设计, 这些设计已经在微软的大规模生产环境中运行多年并有良好的质量口碑。

### 可轻松进行本地部署。

OpenPAI 是一个完整的全栈解决方案。 OpenPAI 不仅支持本地部署、混合部署或公共云部署，还支持单机部署，让用户可以方便地试用。

### 支持流行的 AI 框架和异构硬件

OpenPAI 提供了预构建的支持主流 AI 框架的 Docker。 很容易增加异构的硬件。 支持分布式训练, 如分布式 TensorFlow。

### 最完整的解决方案，并且易于扩展

OpenPAI 是支持深度学习、虚拟集群，兼容 Hadoop/Kubernetes 生态系统的完整解决方案。 OpenPAI 支持可扩展组件：可根据需要接入扩展模块。

## 相关项目

以探索先进技术和开放为目标，[Microsoft Research (MSR)](https://www.microsoft.com/en-us/research/group/systems-research-group-asia/) 还发布了一些相关的开源项目。

* [NNI](https://github.com/Microsoft/nni): 用于神经体系结构搜索和超参数调优的开源 AutoML 工具包。 我们鼓励研究人员和学生利用这些项目来加速 AI 开发和研究。
* [MMdnn](https://github.com/Microsoft/MMdnn)：一个完整、跨框架的解决方案，能够转换、可视化、诊断深度神经网络模型。 MMdnn 中的 "MM" 表示 model management（模型管理），而 "dnn" 是 deep neural network（深度神经网络）的缩写。

## 准备开始

OpenPAI 管理计算资源并为机器学习的各种任务进行优化。 容器技术让计算硬件与软件分离, 用户可以轻松地运行分布式计算任务、使用一种或多种深度学习框架完成任务。

因为OpenPAI 是一个平台, 所以准备工作的第一步就是  部署集群 </0 > 。 OpenPAI 还支持部署在一台服务器上。</p> 

如果集群已准备就绪, 请参考 [训练模型 ](#train-models) 部分。

## 部署 OpenPAI

请按照本节内容检查先决条件, 部署和验证 OpenPAI 集群。 在初始部署后, 可以根据需要添加更多的服务器。

强烈建议在空闲的服务器上试用 OpenPAI。 有关硬件规范, 请参阅 [这里](https://github.com/Microsoft/pai/wiki/Resource-Requirement)。

### 先决条件和准备工作

* ubuntu 16.04 (18.04 应该能工作, 但没有经过充分测试）。
* 为每台服务器分配一个静态 IP 地址, 并确保服务器可以相互通信。
* 确保服务器可以访问互联网, 尤其需要访问容器注册服务 （docker hub registry）或其镜像。 在部署过程中，我们需要从 OpenPAI 服务器上下载容器 （docker）文件。
* 确保 SSH 服务已启用, 并共享相同的用户名称/密码, 并具有 sudo 权限。
* 确保 NTP 服务已启用。
* 建议不手动安装容器，如果要安装，容器的版本必须高于1.26。
* OpenPAI 会占用内存和 CPU 资源来运行各种服务, 因此请确保有足够的资源来运行机器学习作业。 有关详细信息, 请查看 [ 硬件要求 ](https://github.com/Microsoft/pai/wiki/Resource-Requirement)"。
* 请指定一个专用服务器运行OpenPAI的服务。 OpenPAI 服务管理服务器的所有 CPU、内存和 GPU 资源。 如果这个服务器上有其他的工作负载, 就可能导致由于资源不足产生的各种问题。

### 部署

对于不超过 50 台的服务器集群，请看这个部署指导： [默认设置下的部署](#Deploy-with-default-configuration)。 在默认配置的基础上, 可以针对不同的硬件环境和使用场景来修改部署方案，达到优化的效果。

#### 使用默认配置进行部署

对于小于50台服务器的中小型群集, 建议 [使用默认配置部署](docs/pai-management/doc/distributed-deploy.md)。 如果只有一台功能强大的服务器, 请参考 部署OpenPAI到单个机器</0 > 文档。</p> 

For a large size cluster, this section is still needed to generate default configuration, then [customize the deployment](#customize-deployment).

#### 自定义部署

用户可以根据硬件配置和试用情况，参考 <0> 定制化部署 </0> 的建议来进行之定义部署。 请参考 [ 定制化部署 ](docs/pai-management/doc/how-to-generate-cluster-config.md#Optional-Step-3.-Customize-configure-OpenPAI) 的建议来进行之定义部署。 

### 验证部署是否成功

在部署后, 建议 [ 验证OpenPAI的关键模块](docs/pai-management/doc/validate-deployment.md) 来确定它们处于良好的运行状况。 验证成功后, 可以 提交一个 hello world 任务</0 >, 来检查全部流程是否正常工作。</p> 

### 在 "训练模型" 之前培训用户

OpenPAI 的通常用户操作是提交作业请求, 等待作业获得计算资源并执行。 这和在专用服务器执行作业的体验不同。 用户可能会觉得计算资源无法控制, 觉得体验不够好，学习曲线可能高于在专用服务器上运行作业。 但总的来说， OpenPAI 上的共享资源可以显著提高生产效率, 并节省维护环境的成本。

对于 OpenPAI 的管理员来说, 成功部署是第一步, 第二步是让 OpenPAI 的用户了解它好处并知道如何正确使用。 OpenPAI 的用户可以从 [训练模型 ](#train-models) 文档中学习。 But below content is for various scenarios and may be too much to specific users. So, a simplified document based on below content is easier to learn.

### FAQ

如果在部署过程中碰到问题， 请首先看 [常见问题](docs/faq.md#deploy-and-maintenance-related-faqs) 文档。

如果还不能解决问题， 请在 [ 这里 ](#get-involved)提问或者提交问题报告。 

## 训练模型

Like all machine learning platforms, OpenPAI is a productive tool. To maximize utilization, it's recommended to submit training jobs and let OpenPAI to allocate resource and run it. If there are too many jobs, some jobs may be queued until enough resource available, and OpenPAI choose some server(s) to run a job. This is different with run code on dedicated servers, and it needs a bit more knowledge about how to submit/manage training jobs on OpenPAI.

Note, OpenPAI also supports to allocate on demand resource besides queuing jobs. Users can use SSH or Jupyter to connect like on a physical server, refer to [here](examples/jupyter/README.md) about how to use OpenPAI like this way. Though it's not efficient to resources, but it also saves cost on setup and managing environments on physical servers.

### Submit training jobs

Follow [submitting a hello-world job](docs/user/training.md), and learn more about training models on OpenPAI. It's a very simple job and used to understand OpenPAI job definition and familiar with Web portal.

### OpenPAI VS Code Client

[OpenPAI VS Code Client](contrib/pai_vscode/VSCodeExt.md) is a friendly, GUI based client tool of OpenPAI. It's an extension of Visual Studio Code. It can submit job, simulate job running locally, manage multiple OpenPAI environments, and so on.

### Troubleshooting job failure

Web portal and job log are helpful to analyze job failure, and OpenPAI supports SSH into environment for debugging.

Refer to [here](docs/user/troubleshooting_job.md) for more information about troubleshooting job failure. It's recommended to get code succeeded locally, then submit to OpenPAI. It reduces posibility to troubleshoot remotely.

## Administration

* [Manage cluster with paictl](docs/paictl/paictl-manual.md)
* [Monitoring](./docs/webportal/README.md)

## Reference

* [Job definition](docs/job_tutorial.md)
* [RESTful API](docs/rest-server/API.md)
* Design documents could be found [here](docs).

## Get involved

* [Stack Overflow](./docs/stackoverflow.md): If you have questions about OpenPAI, please submit question at Stack Overflow under tag: openpai
* [Gitter chat](https://gitter.im/Microsoft/pai): You can also ask questions in microsoft/pai conversation.
* [Create an issue or feature request](https://github.com/Microsoft/pai/issues/new/choose): If you have issue/ bug/ new feature, please submit it to GitHub.

## How to contribute

### Contributor License Agreement

This project welcomes contributions and suggestions. Most contributions require you to agree to a Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us the rights to use your contribution. For details, visit https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact <opencode@microsoft.com> with any additional questions or comments.

### Call for contribution

We are working on a set of major features improvement and refactor, anyone who is familiar with the features is encouraged to join the design review and discussion in the corresponding issue ticket.

* PAI virtual cluster design. [Issue 1754](https://github.com/Microsoft/pai/issues/1754)
* PAI protocol design. [Issue 2007](https://github.com/Microsoft/pai/issues/2007)

### Who should consider contributing to OpenPAI

* Folks who want to add support for other ML and DL frameworks
* Folks who want to make OpenPAI a richer AI platform (e.g. support for more ML pipelines, hyperparameter tuning)
* Folks who want to write tutorials/blog posts showing how to use OpenPAI to solve AI problems

### Contributors

One key purpose of PAI is to support the highly diversified requirements from academia and industry. PAI is completely open: it is under the MIT license. This makes PAI particularly attractive to evaluate various research ideas, which include but not limited to the [components](./docs/research_education.md).

PAI operates in an open model. It is initially designed and developed by [Microsoft Research (MSR)](https://www.microsoft.com/en-us/research/group/systems-research-group-asia/) and [Microsoft Search Technology Center (STC)](https://www.microsoft.com/en-us/ard/company/introduction.aspx) platform team. We are glad to have [Peking University](http://eecs.pku.edu.cn/EN/), [Xi'an Jiaotong University](http://www.aiar.xjtu.edu.cn/), [Zhejiang University](http://www.cesc.zju.edu.cn/index_e.htm), and [University of Science and Technology of China](http://eeis.ustc.edu.cn/) join us to develop the platform jointly. Contributions from academia and industry are all highly welcome.