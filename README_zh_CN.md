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

根据以下内容来检查先决条件，部署并验证 OpenPAI 集群。 初次部署完成后，还可以根据需要添加新的服务器。

强烈建议在空闲的服务器上安装 OpenPAI。 有关硬件规范，参考[这里](https://github.com/Microsoft/pai/wiki/Resource-Requirement)。

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

对于小于 50 台服务器的中小型集群，参考[使用默认设置部署](#使用默认配置部署)，用最简单的方式来部署 OpoenPAI。 在默认配置的基础上，可针对不同的硬件环境和使用场景来定制优化部署方案。

#### 使用默认配置部署

对于小于 50 台服务器的中小型集群, 建议[使用默认配置部署](docs/zh_CN/pai-management/doc/distributed-deploy.md)。 如果只有一台高性能的计算服务器，参考[在单机上部署 OpenPAI](docs/zh_CN/pai-management/doc/single-box.md)。

对于大型集群，仍需要根据此向导来生成默认配置，然后再[自定义部署配置](#自定义部署)。

#### 自定义部署

由于不同的硬件环境和使用场景，OpenPAI 的默认配置需要通过自定义来修改。 参考[自定义部署](docs/zh_CN/pai-management/doc/how-to-generate-cluster-config.md#Optional-Step-3.-Customize-configure-OpenPAI)，了解详情。

### 验证部署

部署完成后，建议参考[验证 OpenPAI 的关键组件](docs/zh_CN/pai-management/doc/validate-deployment.md)来确认 OpenPAI 处于正常状态。 验证成功后，可[提交 hello-world Job](docs/zh_CN/user/training.md) 进行端到端的验证。

### 培训用户

OpenPAI 的一般用法是提交 Job 请求，等到 Job 获得计算资源后再开始执行。 这和每个人在自己的服务器上运行是不同的。 用户可能会觉得，与在自己的机器上训练相比，这样无法管理计算资源，而且还需要学习如何使用 OpenPAI。 但通过 OpenPAI 来共享资源能够提高资源利用率，并显著节省维护运行的时间。

对于 OpenPAI 的管理员来说，部署成功只是第一步，而第二步是让用户理解 OpenPAI 带来的好处，并学会使用它。 用户可从[训练模型](#训练模型)开始学习如何使用。 虽然下面训练模型的章节覆盖了各种场景下的方案，但用户通常不需要了解所有的方法。 因此，管理员可以根据用户的实际场景来创建更简单的文档。

### 常见问答

如果在部署过程中遇到问题，先查看[这里](docs/zh_CN/faq.md#deploy-and-maintenance-related-faqs)。

如果还不能解决问题，通过[这里](#寻求帮助)来讨论或者提交问题。

## 训练模型

与所有计算平台一样，OpenPAI 是提高生产力的工具，最大限度地利用资源。 因此，在进行模型训练时，推荐直接将任务提交到 OpenPAI，并让其分配资源来运行。 如果 Job 太多，一些 Job 会排队等待资源。 这与在自己的服务器上运行代码不同，并且还需要学习一些在 OpenPAI 上提交并管理训练 Job 的知识。

注意，除了支持 Job 排队，OpenPAI 也支持分配专用的资源。 用户可以像使用物理服务器一样，用 SSH 或 Jupyter Notebook 来连接，详情参考[这里](examples/jupyter/README.md)。 虽然这样对资源的利用不高，但也节省了在物理服务器上配置管理环境的精力。

### 提交训练作业

参考[提交 Job 教程](docs/zh_CN/user/job_submission.md)来学习如何在 OpenPAI 上训练模型。 这是使用 OpenPAI 的入门教程。

### 客户端

[OpenPAI VS Code Client](contrib/pai_vscode/VSCodeExt_zh_CN.md) 是推荐的 OpenPAI 客户端工具，其基于图形界面，易于使用。 它是 Visual Studio Code 的扩展。 支持提交 Job，在本地模拟运行 Job，管理多个 OpenPAI 环境等等。

### 调研 Job 错误

Web 界面和 Job 日志有助于分析错误，OpenPAI 也支持通过 SSH 登录来调试。

有关调研 Job 错误的详细信息参考[这里](docs/zh_CN/user/troubleshooting_job.md)。

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

本项目欢迎任何贡献和建议。 大多数贡献都需要你同意参与者许可协议（CLA），来声明你有权，并实际上授予我们有权使用你的贡献。 有关详细信息，请访问 https://cla.microsoft.com。

当你提交拉取请求时，CLA 机器人会自动检查你是否需要提供 CLA，并修饰这个拉取请求（例如，标签、注释）。 只需要按照机器人提供的说明进行操作即可。 CLA 只需要同意一次，就能应用到所有的代码仓库上。

该项目采用了 [ Microsoft 开源行为准则 ](https://opensource.microsoft.com/codeofconduct/)。 有关详细信息，请参阅[行为守则常见问题解答](https://opensource.microsoft.com/codeofconduct/faq/)或联系 opencode@microsoft.com 咨询问题或评论。

### 征集意见建议

当前，正在进行一些主要功能的改进和重构，如果熟悉这些功能，可在相应的讨论区中参与设计评审和讨论。

* OpenPAI 虚拟集群设计。 [Issue 1754](https://github.com/Microsoft/pai/issues/1754)
* OpenPAI 协议设计。 [Issue 2007](https://github.com/Microsoft/pai/issues/2007)

### 考虑为 OpenPAI 做贡献

* 希望添加对其它机器学习或深度学习框架的支持
* 希望 OpenPAI 成为更强大的 AI 平台（例如，支持更多的机器学习流程，超参调优)
* 希望写作教程和博客文章，来展示如何使用 OpenPAI 解决 AI 问题

### 贡献者

OpenPAI 的一个重要目标是支持学术界和工业界非常多样化的需求。 OpenPAI 是完全开放的：它采用了 MIT 许可证。 这使得 PAI 特别适合用来探索各种研究想法，例如[这些模块](./docs/zh_CN/research_education.md)。

OpenPAI 采用开放的形式来合作。 由[微软研究院（MSR）](https://www.microsoft.com/en-us/research/group/systems-research-group-asia/)和[微软互联网工程院](https://www.microsoft.com/en-us/ard/company/introduction.aspx) AI 平台团队联合设计开发。 很高兴能有北京大学、西安交通大学、浙江大学、中国科学技术大学等高校加入平台开发。 无论是来自从学术界还是工业界的贡献，都非常欢迎。