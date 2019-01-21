# Open Platform for AI (OpenPAI) ![alt text][logo]

[logo]: ./pailogo.jpg "OpenPAI"

[![Build Status](https://travis-ci.org/Microsoft/pai.svg?branch=master)](https://travis-ci.org/Microsoft/pai)
[![Issues](https://img.shields.io/github/issues-raw/Microsoft/pai.svg)](https://github.com/Microsoft/pai/issues?q=is%3Aissue+is%3Aopen)
[![Pull Requests](https://img.shields.io/github/issues-pr-raw/Microsoft/pai.svg)](https://github.com/Microsoft/pai/pulls?q=is%3Apr+is%3Aopen)
[![Coverage Status](https://coveralls.io/repos/github/Microsoft/pai/badge.svg?branch=master)](https://coveralls.io/github/Microsoft/pai?branch=master)
[![Version](https://img.shields.io/github/release/Microsoft/pai.svg)](https://github.com/Microsoft/pai/releases/latest)

OpenPAI is an open source platform that provides complete AI model training and resource management capabilities, it is easy to extend and supports on-premise, cloud and hybrid environments in various scale.

# Table of Contents
1. [When to consider OpenPAI](#when-to-consider-openpai)
2. [Why choose OpenPAI](#why-choose-openpai)
3. [How to deploy](#how-to-deploy)
4. [How to use](#how-to-use)
5. [Resources](#resources)
6. [Get Involved](#get-involved)
7. [How to contribute](#how-to-contribute)

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

OpenPAI is a most complete solution for deep learning, support virtual cluster, compatible Hadoop / kubernetes eco-system, complete training pipeline at one cluster etc. OpenPAI is architected in a modular way: different module can be plugged in as appropriate.

## Related Projects
Targeting at openness and advancing state-of-art technology, [Microsoft Research (MSR)](https://www.microsoft.com/en-us/research/group/systems-research-group-asia/) had also released few other open source projects.
* [NNI](https://github.com/Microsoft/nni) : An open source AutoML toolkit for neural architecture search and hyper-parameter tuning.
We encourage researchers and students leverage these projects to accelerate the AI development and research.
* [MMdnn](https://github.com/Microsoft/MMdnn) : A comprehensive, cross-framework solution to convert, visualize and diagnose deep neural network models. The "MM" in MMdnn stands for model management and "dnn" is an acronym for deep neural network.

## How to deploy
#### 1 Prerequisites <a name="ref_prerequisites"></a>
Before start, you need to meet the following requirements:

- Ubuntu 16.04
- Assign each server a static IP address. Network is reachable between servers.
- Server can access the external network, especially need to have access to a Docker registry service (e.g., Docker hub) to pull the Docker images for the services to be deployed.
- All machines' SSH service is enabled, share the same username / password and have sudo privilege.
- Need to enable NTP service.
- Recommend no Docker installed or a Docker with api version >= 1.26.
- See [hardware resource requirements](https://github.com/Microsoft/pai/wiki/Resource-Requirement).

#### 2 Deploy OpenPAI

If you have a cluster which contains more than 2 machine and want to deploy pai on it. Please choose ```Distributed deploy``` following.

If you only have one mahince, and want to deploy pai on it. Please choose ```Single Box deploy``` following. 


##### 2.1 [Distributed deploy](./docs/pai-management/doc/distributed-deploy.md)
##### 2.2 [Single Box deploy](./docs/pai-management/doc/single-box.md)



## How to use
### How to train jobs
- How to write OpenPAI jobs
    - [Quick start: how to write and submit a CIFAR-10 job](./examples/README.md#quickstart)
    - [Write job from scratch in depth](./docs/job_tutorial.md)
    - [Learn more example jobs](./examples/#offtheshelf)
- How to submit OpenPAI jobs
    - [Submit a job in Web Portal](./docs/submit_from_webportal.md)
    - [Submit a job in Visual Studio](https://github.com/Microsoft/vs-tools-for-ai/blob/master/docs/pai.md)
    - [Submit a job in Visual Studio Code](https://github.com/Microsoft/vscode-tools-for-ai/blob/master/docs/quickstart-05-pai.md)
- How to run AutoML jobs on OpenPAI
    - [Submit a job in Neural Network Intelligence](https://github.com/Microsoft/nni/blob/master/docs/PAIMode.md)
- How to request on-demand resource for in place training
    - [Launch a jupyter notebook and work in it](./examples/jupyter/README.md)

### Cluster administration
- [Deployment infrastructure](./docs/pai-management/doc/distributed-deploy.md)
- [Cluster maintenance](https://github.com/Microsoft/pai/wiki/Maintenance-(Service-&-Machine))
- [Monitoring](./docs/webportal/README.md)

## Resources

- The OpenPAI user [documentation](./docs/documentation.md) provides in-depth instructions for using OpenPAI
- Visit the [release notes](https://github.com/Microsoft/pai/releases) to read about the new features, or download the release today.
- [FAQ](./docs/faq.md)

## Get Involved
- [StackOverflow:](./docs/stackoverflow.md) If you have questions about OpenPAI, please submit question at Stackoverflow under tag: openpai
- [Report an issue:](https://github.com/Microsoft/pai/wiki/Issue-tracking) If you have issue/ bug/ new feature, please submit it at Github
## How to contribute
#### Contributor License Agreement
This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

#### Call for contribution
- PAI virtual cluster design. [Issue 1754](https://github.com/Microsoft/pai/issues/1754)
- PAI protocol design. [Issue 2007](https://github.com/Microsoft/pai/issues/2007)

#### Who should consider contributing to OpenPAI?
- Folks who want to add support for other ML and DL frameworks
- Folks who want to make OpenPAI a richer AI platform (e.g. support for more ML pipelines, hyperparameter tuning)
- Folks who want to write tutorials/blog posts showing how to use OpenPAI to solve AI problems

#### Contributors
One key purpose of PAI is to support the highly diversified requirements from academia and industry. PAI is completely open: it is under the MIT license. This makes PAI particularly attractive to evaluate various research ideas, which include but not limited to the [components](./docs/research_education.md).

PAI operates in an open model. It is initially designed and developed by [Microsoft Research (MSR)](https://www.microsoft.com/en-us/research/group/systems-research-group-asia/) and [Microsoft Search Technology Center (STC)](https://www.microsoft.com/en-us/ard/company/introduction.aspx) platform team.
We are glad to have [Peking University](http://eecs.pku.edu.cn/EN/), [Xi'an Jiaotong University](http://www.aiar.xjtu.edu.cn/), [Zhejiang University](http://www.cesc.zju.edu.cn/index_e.htm), and [University of Science and Technology of China](http://eeis.ustc.edu.cn/) join us to develop the platform jointly.
Contributions from academia and industry are all highly welcome.
