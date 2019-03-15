# AI 开放平台（OpenPAI） ![alt text](./pailogo.jpg "OpenPAI")

[![生成状态](https://travis-ci.org/Microsoft/pai.svg?branch=master)](https://travis-ci.org/Microsoft/pai) [![代码覆盖状态](https://coveralls.io/repos/github/Microsoft/pai/badge.svg?branch=master)](https://coveralls.io/github/Microsoft/pai?branch=master) [![进入 https://gitter.im/Microsoft/pai 聊天室提问](https://badges.gitter.im/Microsoft/pai.svg)](https://gitter.im/Microsoft/pai?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge) [![版本](https://img.shields.io/github/release/Microsoft/pai.svg)](https://github.com/Microsoft/pai/releases/latest)

OpenPAI：作为开源平台，提供了完整的 AI 模型训练和资源管理能力，能轻松扩展，并支持各种规模的私有部署、云和混合环境。

## 目录

1. [适用场景](#when-to-consider-openpai)
2. [特点](#why-choose-openpai)
3. [入门](#get-started)
4. [部署](#deploy-openpai)
5. [训练模型](#train-models)
6. [管理](#administration)
7. [参考](#reference)
8. [寻求帮助](#get-involved)
9. [参与贡献](#how-to-contribute)

## 适用场景

1. 在团队间共享强大的 AI 计算资源（例如，GPU、FPGA 集群）。
2. 在组织内共享或重用 AI 资产（如模型、数据、运行环境等) 。
3. 构建易于 IT 运维的 AI 计算平台。
4. 在一个环境中完成整个模型训练过程。

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

OpenPAI 管理计算资源并为机器学习的各种任务进行优化。 容器技术让计算硬件与软件分离, 用户可以轻松地运行分布式计算任务、使用一种或多种深度学习框架完成任务。

因为OpenPAI 是一个平台, 所以准备工作的第一步就是  部署集群 </0 > 。 OpenPAI 还支持部署在一台服务器上。</p> 

如果集群已准备就绪, 请参考 [训练模型 ](#train-models) 部分。

## 部署

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

对于大型集群, 我们仍然需要此部分来生成默认配置, 然后进行 [ 定制部署 ](#customize-deployment)。

#### 自定义部署

用户可以根据硬件配置和试用情况，参考 <0> 定制化部署 </0> 的建议来进行之定义部署。 请参考 [ 定制化部署 ](docs/pai-management/doc/how-to-generate-cluster-config.md#Optional-Step-3.-Customize-configure-OpenPAI) 的建议来进行之定义部署。 

### 验证部署是否成功

在部署后, 建议 [ 验证OpenPAI的关键模块](docs/pai-management/doc/validate-deployment.md) 来确定它们处于良好的运行状况。 验证成功后, 可以 提交一个 hello world 任务</0 >, 来检查全部流程是否正常工作。</p> 

### 在 "训练模型" 之前培训用户

OpenPAI 的通常用户操作是提交作业请求, 等待作业获得计算资源并执行。 这和在专用服务器执行作业的体验不同。 用户可能会觉得计算资源无法控制, 觉得体验不够好，学习曲线可能高于在专用服务器上运行作业。 但总的来说， OpenPAI 上的共享资源可以显著提高生产效率, 并节省维护环境的成本。

对于 OpenPAI 的管理员来说, 成功部署是第一步, 第二步是让 OpenPAI 的用户了解它好处并知道如何正确使用。 OpenPAI 的用户可以从 [训练模型 ](#train-models) 文档中学习。 下面的内容描述了很多方案, 可能对特定用户来说太多。 因此, 我们可以基于以下简化文档来开始学习。

### 常见问答<FAQ>

如果在部署过程中碰到问题， 请首先看 [常见问题](docs/faq.md#deploy-and-maintenance-related-faqs) 文档。

如果还不能解决问题， 请在 [ 这里 ](#get-involved)提问或者提交问题报告。 

## 训练模型

和所有机器学习平台一样, OpenPAI 是一个提高生产力的工具。 为了最大限度地提高利用率, 建议用户只关注于提交训练作业, 并让 OpenPAI 分配资源并运行资源。 如果提交的作业太多, 则某些作业可能会排队, 直到有足够的资源可用, OpenPAI 会选择合适的服务器来运行作业。 这与专用服务器上运行代码的情况不同, 用户需要了解如何在 OpenPAI 上提交培训作业的知识。

请注意, OpenPAI 还支持按需分配资源, 而不是排队作业。 用户可以使用 SSH 或 Jumyter 像在物理服务器上一样进行连接, 如果要了解更多详情， 请参阅 [ 这个文档 ](examples/jupyter/README.md)。 虽然这种方法对资源的利用不是非常高效, 但它也节省了在物理服务器上设置和管理环境的成本。

### 提交训练作业

请按照这个例子  提交一个 Hello World 作业 </0 > 了解更多有关 OpenPAI 训练模型的信息。 这是一个非常简单的作业, 帮助用户理解 OpenPAI 作业定义、流程和熟悉 Web 门户。</p> 

### OpenPAI VS Code 的客户端

[OpenPAI VS Code 客户端 ](contrib/pai_vscode/VSCodeExt.md) 是 OpenPAI 的一个友好的、基于 GUI 的客户端工具。 它是 Visual Studio Code 的扩展包。 它可以提交作业、模拟作业在本地运行、管理多个 OpenPAI 环境等。

### 作业失败后的疑难解答

Web 门户和作业日志有助于分析作业失败, OpenPAI 支持用户通过 SSH 登入服务器环境进行调试。

有关解决作业故障的详细信息, 请参阅 [ 这里 ](docs/user/troubleshooting_job.md)。 建议在本地成功地运行作业之后，再提交给 OpenPAI 服务器。 这样就降低了远程故障出现的机会。

## Administration

* [使用 paictl 管理集群](docs/paictl/paictl-manual.md)
* [监测](./docs/webportal/README.md)

## 参考资料

* [作业定义](docs/job_tutorial.md)
* [RESTful API](docs/rest-server/API.md)
* 设计文档可以在 [ 这里 ](docs) 找到。

## Get involved

* [Stack Overflow](./docs/stackoverflow.md): 如果您对 OpenPAI 有疑问, 请在 Stack Overflow 网站相应的标签 openpai 下出提交问题。
* Gitter 聊天 </0 >: 你也可以在Gitter聊天中提问。</li> 
    
    * 提交问题或功能请求 </0 >: 如果您有问题，发现了错误，或者有新的功能需求, 请将他们提交到 GitHub 项目页面相应的地方。</li> </ul> 
        
        ## 如何做出贡献
        
        ### 贡献者许可协议
        
        本项目欢迎任何贡献和建议。 大多数贡献都需要你同意参与者许可协议 (CLA)，来声明你有权，并实际上授予我们有权使用你的贡献。 有关详细信息，请访问 https://cla.microsoft.com。
        
        当你提交拉取请求 (Pull Request) 时，CLA机器人会自动检查你是否需要提供CLA，并说明这个拉取请求 （例如，标签、注释）。 只需要按照机器人提供的说明进行操作即可。 You will only need to do this once across all repos using our CLA.
        
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