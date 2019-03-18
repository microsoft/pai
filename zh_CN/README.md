# AI 开放平台（OpenPAI） ![alt text](./pailogo.jpg "OpenPAI")

[![生成状态](https://travis-ci.org/Microsoft/pai.svg?branch=master)](https://travis-ci.org/Microsoft/pai) [![代码覆盖状态](https://coveralls.io/repos/github/Microsoft/pai/badge.svg?branch=master)](https://coveralls.io/github/Microsoft/pai?branch=master) [![进入 https://gitter.im/Microsoft/pai 聊天室提问](https://badges.gitter.im/Microsoft/pai.svg)](https://gitter.im/Microsoft/pai?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge) [![版本](https://img.shields.io/github/release/Microsoft/pai.svg)](https://github.com/Microsoft/pai/releases/latest)

OpenPAI：作为开源平台，提供了完整的 AI 模型训练和资源管理能力，能轻松扩展，并支持各种规模的私有部署、云和混合环境。

## 目录

1. [适用场景](#when-to-consider-openpai)
2. [特点](#why-choose-openpai)
3. [入门](#get-started)
4. [部署](#deploy-openpai)
5. [训练模型](#train-models)
6. [运维管理](#administration)
7. [参考手册](#reference)
8. [寻求帮助](#get-involved)
9. [参与贡献](#how-to-contribute)

## 适用场景

1. 在团队间共享强大的 AI 计算资源（例如，GPU、FPGA 集群）。
2. 在组织内共享或重用 AI 资产（如模型、数据、运行环境等) 。
3. 构建易于 IT 运维的 AI 计算平台。
4. 在同一个环境中完成模型训练过程。

## 特点

OpenPAI 采用了成熟的设计，已在微软的大规模生产环境中，通过多年持续运行的验证。

### 易于本地部署

OpenPAI 是全栈的解决方案。 OpenPAI 不仅支持本地、公有云及混合云中的部署，还支持单机部署，让用户便于试用。

### 支持流行的 AI 框架和异构硬件

OpenPAI 提供了预构建的支持主流 AI 框架的 Docker。 很容易增加异构的硬件。 支持分布式训练, 如分布式 TensorFlow。

### 全栈解决方案、易于扩展

OpenPAI 是支持深度学习、虚拟集群，兼容 Hadoop/Kubernetes 生态系统的完整解决方案。 OpenPAI 支持可扩展组件：可根据需要接入扩展模块。

## 相关项目

以探索先进技术和开放为目标，[Microsoft Research (MSR)](https://www.microsoft.com/en-us/research/group/systems-research-group-asia/) 还发布了一些相关的开源项目。

* [NNI](https://github.com/Microsoft/nni): 用于神经体系结构搜索和超参数调优的开源 AutoML 工具包。 我们鼓励研究人员和学生利用这些项目来加速 AI 开发和研究。
* [MMdnn](https://github.com/Microsoft/MMdnn)：一个完整、跨框架的解决方案，能够转换、可视化、诊断深度神经网络模型。 MMdnn 中的 "MM" 表示 model management（模型管理），而 "dnn" 是 deep neural network（深度神经网络）的缩写。

## 入门

OpenPAI 用于管理计算资源，并对机器学习任务进行了优化。 通过 Docker 技术，硬件计算资源与软件相分离。这样，用户能轻松的进行分布式计算，在不同的深度学习框架间切换，也能在完全一致的环境中重复运行作业。

作为平台，OpenPAI 需要[部署](#deploy-a-cluster)后才能使用。 OpenPAI 也支持单机部署。

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

对于小于 50 台服务器的中小型集群，参考[使用默认设置部署](#Deploy-with-default-configuration)，用最简单的方式来部署 OpoenPAI。 在默认配置的基础上，可针对不同的硬件环境和使用场景来定制优化部署方案。

#### 使用默认配置部署

对于小于 50 台服务器的中小型群集, 建议[使用默认配置部署](docs/pai-management/doc/distributed-deploy.md)。 如果只有一台高性能的计算服务器，参考[在单机上部署 OpenPAI](docs/pai-management/doc/single-box.md)。

对于大型集群，仍需要根据此向导来生成默认配置，然后再[自定义部署配置](#customize-deployment)。

#### 自定义部署

由于不同的硬件环境和使用场景，OpenPAI 的默认配置需要通过自定义来进行优化。 参考[自定义部署](docs/pai-management/doc/how-to-generate-cluster-config.md#Optional-Step-3.-Customize-configure-OpenPAI)，了解详情。

### 验证部署

部署完成后，建议参考[验证 OpenPAI 的关键组件](docs/pai-management/doc/validate-deployment.md)来确认 OpenPAI 处于正常状态。 验证成功后，可[提交 hello-world Job](docs/user/training.md) 进行端到端的验证。

### 培训用户

OpenPAI 的一般用法是提交 Job 请求，等到 Job 获得计算资源后再开始执行。 这和每个人在自己的服务器上运行是不同的。 用户可能会觉得，与在自己的机器上训练相比，这样无法管理计算资源，而且还需要学习如何使用 OpenPAI。 但是，通过 OpenPAI 来共享资源能够提高资源利用率，并节省维护运行的时间。

对于 OpenPAI 的管理员来说，部署成功只是第一步，而第二步是让用户理解 OpenPAI 带来的好处，并学会使用它。 用户可以从[训练模型](#train-models)来开始学习。 下面的训练模型部分适用于多种场景，而用户可能不需要了解所有的内容。 因此，管理员可以根据用户场景来简化文档。

### 常见问答

如果在部署过程中遇到问题，先查看[这里](docs/faq.md#deploy-and-maintenance-related-faqs)。

如果还不能解决问题，通过[这里](#get-involved)来讨论或者提交问题。

## 训练模型

和所有机器学习平台一样，OpenPAI 是一个提高生产力的工具。 为了提高资源利用率，建议用户提交训练 Job，并让 OpenPAI 来分配资源并运行 Job。 如果 Job 太多，一些 Job 会排队并等待可用的资源。 这与在自己的服务器上运行代码不同，并且还需要学习一些在 OpenPAI 上提交并管理训练 Job 的知识。

另外，除了 Job 队列，OpenPAI 也支持分配专用的资源。 用户可以像使用物理服务器一样，用 SSH 或 Jupyter 来连接并使用计算资源。参考[这里](examples/jupyter/README.md)来了解详情。 虽然这样对资源的利用不会高效，但也节省了在物理服务器上配置管理环境的投入。

### 提交训练作业

参考[提交 hello-world Job](docs/user/training.md)，来学习如何在 OpenPAI 上训练模型。 这是一个非常简单的 Job，可以帮助理解 OpenPAI 的 Job 配置，并熟悉 Web 界面。

### OpenPAI VS Code 客户端

[OpenPAI VS Code 客户端 ](contrib/pai_vscode/VSCodeExt.md) 是 OpenPAI 的一个友好的、基于 GUI 的客户端工具。 它是 Visual Studio Code 的扩展包。 它可以提交作业、模拟作业在本地运行、管理多个 OpenPAI 环境等。

### 作业失败后的疑难解答

Web 门户和作业日志有助于分析作业失败, OpenPAI 支持用户通过 SSH 登入服务器环境进行调试。

有关解决作业故障的详细信息, 请参阅 [ 这里 ](docs/user/troubleshooting_job.md)。 建议在本地成功地运行作业之后，再提交给 OpenPAI 服务器。 这样就降低了远程故障出现的机会。

## 运维管理

* [使用 paictl 管理集群](docs/paictl/paictl-manual.md)
* [监测](./docs/webportal/README.md)

## 参考手册

* [作业定义](docs/job_tutorial.md)
* [RESTful API](docs/rest-server/API.md)
* 设计文档可以在 [ 这里 ](docs) 找到。

## 寻求帮助

* [Stack Overflow](./docs/stackoverflow.md): 如果您对 OpenPAI 有疑问, 请在 Stack Overflow 网站相应的标签 openpai 下出提交问题。
* Gitter 聊天 </0 >: 你也可以在Gitter聊天中提问。</li> 
    
    * 提交问题或功能请求 </0 >: 如果您有问题，发现了错误，或者有新的功能需求, 请将他们提交到 GitHub 项目页面相应的地方。</li> </ul> 
        
        ## 参与贡献
        
        ### 贡献者许可协议
        
        本项目欢迎任何贡献和建议。 大多数贡献都需要你同意参与者许可协议 (CLA)，来声明你有权，并实际上授予我们有权使用你的贡献。 有关详细信息，请访问 https://cla.microsoft.com。
        
        当你提交拉取请求 (Pull Request) 时，CLA机器人会自动检查你是否需要提供CLA，并说明这个拉取请求 （例如，标签、注释）。 只需要按照机器人提供的说明进行操作即可。 CLA只需要通过一次，就能应用到所有的代码仓库上。
        
        该项目采用了 [ Microsoft 开源行为准则 ](https://opensource.microsoft.com/codeofconduct/)。 有关详细信息,请参阅 [ 行为守则常见问题解答 ](https://opensource.microsoft.com/codeofconduct/faq/) 或联系 <opencode@microsoft.com> 咨询问题或评论。
        
        ### 欢迎大家的参与
        
        我们正在进行一系列主要功能的改进和重构, 我们鼓励任何熟悉这些功能的人在相应的讨论区中参与设计评审和讨论。
        
        * PAI 虚拟集群设计。 [Issue 1754 ](https://github.com/Microsoft/pai/issues/1754)
        * PAI 协议设计。 [ Issue 2007 ](https://github.com/Microsoft/pai/issues/2007)
        
        ### 谁应该考虑为 OpenPAI 做出贡献
        
        * 希望添加对其他 ML 和 DL 框架的支持的用户
        * 希望 OpenPAI 成为更丰富的 AI 平台的用户 (例如, 支持更多的机器学习流程、超参数调整，等)
        * 想写教程和博客文章的人, 可以展示如何使用 OpenPAI 来解决 AI 问题。
        
        ### 贡献者
        
        OpenPAI 的一个重要目的是支持学术界和工业界高度多样化的需求。 OpenPAI 是完全开放的: 它采用 MIT 许可证。 这使得 PAI 特别适合用来探索各种研究想法, 其中包括但不限于 [ 这些模块 ](./docs/research_education.md)。
        
        OpenPAI 采用开放的形式来合作。 它最初是由微软研究院和微软互联网工程院 AI 平台团队联合开发的。 我们很高兴看到有北大，西安交通大学，浙江大学，中科大等学校加入这个平台的开发。 无论是从学术界还是工业界的贡献都非常欢迎！