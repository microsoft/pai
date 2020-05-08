# Open Platform for AI (OpenPAI) ![alt text][logo]

[logo]: ./pailogo.jpg "OpenPAI"

[![Build Status](https://travis-ci.org/microsoft/pai.svg?branch=master)](https://travis-ci.org/microsoft/pai)
[![Coverage Status](https://coveralls.io/repos/github/microsoft/pai/badge.svg?branch=master)](https://coveralls.io/github/microsoft/pai?branch=master)
[![Join the chat at https://gitter.im/Microsoft/pai](https://badges.gitter.im/Microsoft/pai.svg)](https://gitter.im/Microsoft/pai?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Version](https://img.shields.io/github/release/Microsoft/pai.svg)](https://github.com/Microsoft/pai/releases/latest)

[简体中文](README_zh_CN.md)

OpenPAI is an open source platform that provides complete AI model training and resource management capabilities, it is easy to extend and supports on-premise, cloud and hybrid environments in various scale.

**OpenPAI [v0.14.0](./RELEASE_NOTE.md#july-2019-version-0140) has been released!**

## Table of Contents

1. [When to consider OpenPAI](#when-to-consider-openpai)
2. [Why choose OpenPAI](#why-choose-openpai)
3. [Get started](#get-started)
    - [Manual for cluster administrators](#manual-for-cluster-administrators)
   x - [Manual for cluster users](#manual-for-cluster-users)
4. [Reference](#reference)
5. [Get involved](#get-involved)
6. [How to contribute](#how-to-contribute)

## When to consider OpenPAI

1. When your organization needs to share powerful AI computing resources (GPU/FPGA farm, etc.) among teams.
2. When your organization needs to share and reuse common AI assets like Model, Data, Environment, etc.
3. When your organization needs an easy IT ops platform for AI.
4. When you want to run a complete training pipeline in one place.

## Why choose OpenPAI

The platform incorporates the mature design that has a proven track record in Microsoft's large-scale production environment.

### Support on-premises and easy to deploy

OpenPAI is a full stack solution. OpenPAI not only supports on-premises, hybrid, or public Cloud deployment but also supports single-box deployment for trial users.

### Support popular AI frameworks and heterogeneous hardware

Pre-built docker for popular AI frameworks. Easy to include heterogeneous hardware. Support Distributed training, such as distributed TensorFlow.

### Most complete solution and easy to extend

OpenPAI is a most complete solution for deep learning, support virtual cluster, compatible with Kubernetes eco-system, complete training pipeline at one cluster etc. OpenPAI is architected in a modular way: different module can be plugged in as appropriate. [Here](./docs/system_architecture.md) is the architecture of OpenPAI, highlighting technical innovations of the platform.

## Related Projects

Targeting at openness and advancing state-of-art technology, [Microsoft Research (MSR)](https://www.microsoft.com/en-us/research/group/systems-research-group-asia/) and [Microsoft Search Technology Center (STC)](https://www.microsoft.com/en-us/ard/company/introduction.aspx) had also released few other open source projects.

* [NNI](https://github.com/Microsoft/nni) : An open source AutoML toolkit for neural architecture search and hyper-parameter tuning.
We encourage researchers and students leverage these projects to accelerate the AI development and research.
* [MMdnn](https://github.com/Microsoft/MMdnn) : A comprehensive, cross-framework solution to convert, visualize and diagnose deep neural network models. The "MM" in MMdnn stands for model management and "dnn" is an acronym for deep neural network.
* [NeuronBlocks](https://github.com/Microsoft/NeuronBlocks) : An NLP deep learning modeling toolkit that helps engineers to build DNN models like playing Lego. The main goal of this toolkit is to minimize developing cost for NLP deep neural network model building, including both training and inference stages.
* [SPTAG](https://github.com/Microsoft/SPTAG) : Space Partition Tree And Graph (SPTAG) is an open source library for large scale vector approximate nearest neighbor search scenario.

## Get started

OpenPAI manages computing resources and is optimized for deep learning. Through docker technology, the computing hardware are decoupled with software, so that it's easy to run distributed jobs, switch with different deep learning frameworks, or run other kinds of jobs on consistent environments.

As OpenPAI is a platform, there might be two different roles who are involved. One is the cluster administrator, and the other is the cluster user. We provide end-to-end manuals for different roles.

### Manual for cluster administrators

The [admin manual](https://openpai.readthedocs.io/en/latest/manual/cluster-admin/README.html) introduces the installation and uninstallation of OpenPAI, some basic management operations, storage management, troubleshootiong, etc.

#### Installation

The first thing an administrator should do is to install OpenPAI. You can refer to the [installation guide](https://openpai.readthedocs.io/en/latest/manual/cluster-admin/installation-guide.html) in the manual for instruction.

If there is any question during deployment, check [FAQ](https://openpai.readthedocs.io/en/latest/manual/cluster-admin/installation-faqs-and-troubleshooting.html) firstly. If FAQ doesn't resolve it, refer to [here](#get-involved) to ask question or submit an issue.

#### Train users before "train models"

The common practice on OpenPAI is to submit job requests, and wait jobs got computing resource and executed. It's different experience with assigning dedicated servers to each one. People may feel computing resource is not in control and the learning curve may be higher than run job on dedicated servers. But shared resource on OpenPAI can improve utilization of resources and save time on maintaining environments.

For administrators of OpenPAI, a successful deployment is first step, the second step is to let users of OpenPAI understand benefits and know how to use it. Users can learn from [the user manual](https://openpai.readthedocs.io/en/latest/manual/cluster-user/README.html). But it is for various scenarios and maybe users don't need all of them. So, administrators can create simplified documents as users' actual scenarios.

#### Administration

Some other contents in the [admin manual](https://openpai.readthedocs.io/en/latest/manual/cluster-admin/README.html):

* [Manage cluster on webportal](https://openpai.readthedocs.io/en/latest/manual/cluster-admin/basic-management-operations.html#management-on-webportal)
* [Manage cluster with paictl](https://openpai.readthedocs.io/en/latest/manual/cluster-admin/basic-management-operations.html#pai-service-management-and-paictl)
* [Set up storage](https://openpai.readthedocs.io/en/latest/manual/cluster-admin/how-to-set-up-storage.html)

Please refer to [here](https://openpai.readthedocs.io/en/latest/manual/cluster-admin/README.html) for the full contents.

### Manual for cluster users

The [user manual](https://openpai.readthedocs.io/en/latest/manual/cluster-user/README.html) introduces how to submit job, debug job, manage data, use Marketplace and VSCode extension.

#### Quick Start

Follow [the quick start tutorial](https://openpai.readthedocs.io/en/latest/manual/cluster-user/quick-start.html) to learn more how to train models on OpenPAI. It's a good start to learn How to use OpenPAI.

#### Client tool

[OpenPAI VS Code Client](https://openpai.readthedocs.io/en/latest/manual/cluster-user/use-vscode-extension.html) is a friendly, GUI based client tool of OpenPAI, and it's highly recommended. It's an extension of Visual Studio Code. It can submit job, simulate jobs locally, manage multiple OpenPAI environments, and so on.

As all computing platforms, OpenPAI is a productive tool and to maximize utilization of resources. So, it's recommended to submit training jobs and let OpenPAI to allocate resource and run jobs. If there are too many jobs, some jobs may be queued until enough resource available. This is different experience with running code on dedicated servers, so it needs a bit more knowledge about how to submit and manage jobs on OpenPAI.

Note, besides queuing jobs, OpenPAI also supports to allocate dedicated resources. Users can [use SSH](https://openpai.readthedocs.io/en/latest/manual/cluster-user/how-to-debug-jobs.html#how-to-use-ssh) or Jupyter Notebook like on a physical server. Though it's not efficient to use resources, but it also saves cost on setup and managing environments on physical servers. Please refer to [here](https://openpai.readthedocs.io/en/latest/manual/cluster-user/README.html) for full contents of user manual.

## Reference

* [Client tool](https://github.com/Microsoft/openpaivscode/blob/master/VSCodeExt.md)
* [Set up storage](https://openpai.readthedocs.io/en/latest/manual/cluster-admin/how-to-set-up-storage.html) and [use storage](https://openpai.readthedocs.io/en/latest/manual/cluster-user/how-to-manage-data.html)
* [Job protocol](https://github.com/microsoft/openpai-protocol)
* [RESTful API](https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/microsoft/pai/master/src/rest-server/docs/swagger.yaml)
* Design documents could be found [here](docs) if you are curious.

## Get involved

* [Stack Overflow](./docs/stackoverflow.md): If you have questions about OpenPAI, please submit question at Stack Overflow under tag: openpai
* [Gitter chat](https://gitter.im/Microsoft/pai): You can also ask questions in Microsoft/pai conversation.
* [Create an issue or feature request](https://github.com/Microsoft/pai/issues/new/choose): If you have issue/ bug/ new feature, please submit it to GitHub.

## How to contribute

### Contributor License Agreement

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

### Call for contribution

We are working on a set of major features improvement and refactor, anyone who is familiar with the features is encouraged to join the design review and discussion in the corresponding issue ticket.

* OpenPAI virtual cluster design. [Issue 1754](https://github.com/Microsoft/pai/issues/1754)
* OpenPAI protocol design. [Issue 2007](https://github.com/Microsoft/pai/issues/2007)

### Who should consider contributing to OpenPAI

* Folks who want to add support for other ML and DL frameworks
* Folks who want to make OpenPAI a richer AI platform (e.g. support for more ML pipelines, hyperparameter tuning)
* Folks who want to write tutorials/blog posts showing how to use OpenPAI to solve AI problems

### Contributors

One key purpose of PAI is to support the highly diversified requirements from academia and industry. PAI is completely open: it is under the MIT license. This makes PAI particularly attractive to evaluate various research ideas, which include but not limited to the [components](./docs/research_education.md).

PAI operates in an open model. It is initially designed and developed by [Microsoft Research (MSR)](https://www.microsoft.com/en-us/research/group/systems-research-group-asia/) and [Microsoft Search Technology Center (STC)](https://www.microsoft.com/en-us/ard/overview) platform team.
We are glad to have [Peking University](http://eecs.pku.edu.cn/EN/), [Xi'an Jiaotong University](http://www.aiar.xjtu.edu.cn/), [Zhejiang University](http://www.cesc.zju.edu.cn/index_e.htm), and [University of Science and Technology of China](http://eeis.ustc.edu.cn/) join us to develop the platform jointly.
Contributions from academia and industry are all highly welcome.
