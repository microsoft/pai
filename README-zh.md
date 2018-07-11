# Open Platform for AI (PAI) ![alt text][logo]

[logo]: ./pailogo.jpg "OpenPAI"

[![Build Status](https://travis-ci.org/Microsoft/pai.svg?branch=master)](https://travis-ci.org/Microsoft/pai)
[![Coverage Status](https://coveralls.io/repos/github/Microsoft/pai/badge.svg?branch=master)](https://coveralls.io/github/Microsoft/pai?branch=master)


## 概述
PAI 是一个集群管理和资源调度平台，该平台结合了一些成熟的设计，在大规模的微软生产环境中试运行表现良好。

PAI 支持运行在 GPU 集群的 AI jobs（如深度学习任务）。本平台提供 PAI 运行环境，包括现有的深度学习框架 CNTK 及 Tensorflow，基于二者的深度学习 job 无需修改任何代码即可在 PAI 运行。PAI 具有极强的扩展性，仅需几行 Python 代码即可支持新的深度学习框架（或其他 AI 任务）。

PAI 支持 GPU 调度，这在深度学习任务中尤为重要。为了获得更好的性能，PAI 支持细粒度的拓扑感知 job
 布局，可以请求特定位置的 GPU（例如，请求位于相同的 PCI-E 交换机的 GPU）。

PAI 100% 采用[微服务 (microservices) ](https://en.wikipedia.org/wiki/Microservices)架构：每个组件都在容器中运行。系统利用 [Kubernetes](https://kubernetes.io) 来部署和管理系统中的静态组件。动态的深度学习 jobs 由我们的带 [GPU 增强](https://issues.apache.org/jira/browse/YARN-7481)的 Hadoop YARN 进行调度和管理。训练数据和结果存储在 Hadoop HDFS 中。

## 研发和教育的开放式  AI 平台 
PAI 的一个主要目的是支持学术界和工业界高度多样化的需求。PAI 是完全开放的：采用宽松的 MIT 许可协议。PAI以模块化方式构建，可以根据需要插入不同的模块。这使得 PAI 对评估各种研究创意极具吸引力。PAI 包括但不限于以下功能或模块：

* 深度学习任务的调度机制
* 创建用于评估深度神经网络应用的现实环境
* 测试新的深度学习框架
* 自动化机器学习（AutoML）
* AI 编译器技术
* AI 高性能网络
* 分析工具，包括网络，平台和 AI job 分析
* AI 基准套件
* 用于 AI 的新硬件，包括 FPGA，ASIC，神经处理器
* AI 存储支持
* AI 平台管理

PAI 以开放模式运营，最初由[微软亚洲研究院](https://www.microsoft.com/en-us/research/group/systems-research-group-asia/)和[微软亚洲互联网工程院](https://www.microsoft.com/en-us/ard/company/introduction.aspx) platform 组设计研发。目前，热烈欢迎[北京大学](http://eecs.pku.edu.cn/EN/)，[西安交通大学](http://www.aiar.xjtu.edu.cn/)，[浙江大学](http://www.cesc.zju.edu.cn/index_e.htm)和[中国科技大学](http://eeis.ustc.edu.cn/)的加入，与我们共同研发该平台。同时高度欢迎学术界及工业界的贡献与建议。


## 系统部署

### 先决条件
系统运行在配备一个或多个 GPU 的机器集群中。
集群中的每台计算机都运行 Ubuntu 16.04 LTS 并具有静态分配的IP地址。
要部署服务，系统需要 Docker registry（如 [Docker Hub](https://docs.docker.com/docker-hub/)）来存储相应 Docker 镜像。
系统还需要一个运行在相同环境中的开发机器（dev-machine），该机器可以完全访问群集。
系统需要 [NTP](http://www.ntp.org/) 服务进行时钟同步。

### 部署步骤
1. 生成  [Hadoop-AI](./hadoop-ai/README-zh.md) 二进制文件并参考该文档在集群配置文件中指定其路径*
2. [部署 Kubernetes 及系统服务](./pai-management/README-zh.md)
3. 访问 [Web Portal](./webportal/README-zh.md) 提交 job 和管理集群

\* 若略过步骤 1，系统将默认安装 Hadoop 2.7.2 标准版。

#### 部署 Kubernetes
该平台利用Kubernetes（k8s）部署和管理系统服务。
部署 k8s 的详细步骤请参考[部署 Kubernetes 及系统服务](./pai-management/README-zh.md) 。


#### 部署服务
在部署 k8s 之后，系统将利用 k8s 的内置功能（例如configmap）来部署系统服务。
部署系统服务的详细步骤请参考[部署 Kubernetes 及系统服务](./pai-management/README-zh.md) 

#### job 管理
系统服务部署完成后，用户可以访问 Web Portal 进行集群管理和 job 管理。
提交job的详细步骤请参考[ PAI 深度学习任务指南](job-tutorial/README-zh.md)

#### 集群管理
Web Portal 也提供了用于集群管理的界面。

## 系统架构

<p style="text-align: left;">
  <img src="./sysarch.png" title="System Architecture" alt="System Architecture" />
</p>

上图阐述了 PAI 的系统架构。 用户可以在 [Web Portal](./webportal/README-zh.md) 上提交 job 或监控集群状态，它通过调用 [REST Server](./rest-server/README-zh.md) 提供的 API 来完成操作。第三方工具也可以直接调用 REST Server API 进行作业管理。在收到API调用后，REST Server 与 [FrameworkLauncher](./frameworklauncher/README.md)（简称Launcher）协调执行 job 管理。Launcher 服务器处理来自 REST Server 的请求并将 job 提交给 Hadoop YARN。 YARN 通过 [GPU 增强](https://issues.apache.org/jira/browse/YARN-7481)使其调度 job 时可以利用集群中的 GPU 进行深度学习计算。 其他基于 CPU 的 AI 任务或传统的大数据 job 也可以在该平台上运行，并与这些基于 GPU 的工作共存。该平台利用HDFS来存储数据。 假定所有 job 都支持HDFS。所有静态服务（上图中的蓝色框）由 Kubernetes 管理，而 job（紫色框）由 Hadoop YARN 管理。

## 参与贡献
本项目欢迎贡献和建议。贡献代码时需要同意参与者许可协议（Contributor License Agreement，CLA）声明您有权并且实际上授予我们使用您贡献的权利。完整协议参见 https://cla.microsoft.com。

当您提交 Pull Request（PR） 时，CLA-bot 将自动确定您是否需要提供 CLA 并适当装饰 PR（例如，标签，评论）。 只需遵循 CLA-bot 提供的说明。 在我们的项目中您只需要完成一次 CLA 认证。

该项目已通过 [Microsoft开放源代码行为准则](https://opensource.microsoft.com/codeofconduct/)。 欲了解更多信息，请参阅[行为准则常见问题解答](https://opensource.microsoft.com/codeofconduct/faq/) ，若有其他问题或意见，请联系[opencode@microsoft.com](mailto:opencode@microsoft.com)

