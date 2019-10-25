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
4. [Deploy OpenPAI](#deploy-openpai)
5. [Train models](#train-models)
6. [Administration](#administration)
7. [Reference](#reference)
8. [Get involved](#get-involved)
9. [How to contribute](#how-to-contribute)

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

OpenPAI is a most complete solution for deep learning, support virtual cluster, compatible Hadoop / Kubernetes eco-system, complete training pipeline at one cluster etc. OpenPAI is architected in a modular way: different module can be plugged in as appropriate.

## Related Projects

Targeting at openness and advancing state-of-art technology, [Microsoft Research (MSR)](https://www.microsoft.com/en-us/research/group/systems-research-group-asia/) and [Microsoft Search Technology Center (STC)](https://www.microsoft.com/en-us/ard/company/introduction.aspx) had also released few other open source projects.

* [NNI](https://github.com/Microsoft/nni) : An open source AutoML toolkit for neural architecture search and hyper-parameter tuning.
We encourage researchers and students leverage these projects to accelerate the AI development and research.
* [FrameworkController](https://github.com/Microsoft/frameworkcontroller) : A general purpose Kubernetes controller to orchestrate all kinds of applications.
* [MMdnn](https://github.com/Microsoft/MMdnn) : A comprehensive, cross-framework solution to convert, visualize and diagnose deep neural network models. The "MM" in MMdnn stands for model management and "dnn" is an acronym for deep neural network.
* [NeuronBlocks](https://github.com/Microsoft/NeuronBlocks) : An NLP deep learning modeling toolkit that helps engineers to build DNN models like playing Lego. The main goal of this toolkit is to minimize developing cost for NLP deep neural network model building, including both training and inference stages.
* [SPTAG](https://github.com/Microsoft/SPTAG) : Space Partition Tree And Graph (SPTAG) is an open source library for large scale vector approximate nearest neighbor search scenario.

## Get started

OpenPAI manages computing resources and is optimized for deep learning. Through docker technology, the computing hardware are decoupled with software, so that it's easy to run distributed jobs, switch with different deep learning frameworks, or run other kinds of jobs on consistent environments.

As OpenPAI is a platform, [deploy a cluster](#deploy-a-cluster) is first step before using. A single server is also supported to deploy OpenPAI and manage its resource.

If the cluster is ready, learn from [train models](#train-models) about how to use it.

## Deploy OpenPAI

Follow this part to check prerequisites, deploy and validate an OpenPAI cluster. More servers can be added as needed after initial deployed.

It's highly recommended to try OpenPAI on server(s), which has no usage and service. Refer to [here](https://github.com/Microsoft/pai/wiki/Resource-Requirement) for hardware specification.

### Prerequisites and preparation

* Ubuntu 16.04 (18.04 should work, but not fully tested.)
* Assign each server a static IP address, and make sure servers can communicate each other.
* Server can access internet, especially need to have access to the docker hub registry service or its mirror. Deployment process will pull Docker images of OpenPAI.
* SSH service is enabled and share the same username/password and have sudo privilege.
* NTP service is enabled.
* Recommend not to install docker or docker's version must be higher than 1.26.
* OpenPAI reserves memory and CPU for service running, so make sure there are enough resource to run machine learning jobs. Check [hardware requirements](https://github.com/Microsoft/pai/wiki/Resource-Requirement) for details.
* Dedicated servers for OpenPAI. OpenPAI manages all CPU, memory and GPU resources of servers. If there is any other workload, it may cause unknown problem due to insufficient resource.

### Deploy

The [Deploy with default configuration](#Deploy-with-default-configuration) part is minimum steps to deploy an OpenPAI cluster, and it's suitable for most small and middle size clusters within 50 servers. Base on the default configuration, the customized deployment can optimize the cluster for different hardware environments and use scenarios.

#### Deploy with default configuration

For a small or medium size cluster, which is less than 50 servers, it's recommended to [deploy with default configuration](docs/pai-management/doc/distributed-deploy.md). if there is only one powerful server, refer to [deploy OpenPAI as a single box](docs/pai-management/doc/single-box.md).

For a large size cluster, this section is still needed to generate default configuration, then [customize the deployment](#customize-deployment).

#### Customize deployment

As various hardware environments and different use scenarios, default configuration of OpenPAI may need to be optimized. Following [Customize deployment](docs/pai-management/doc/how-to-generate-cluster-config.md#Optional-Step-3.-Customize-configure-OpenPAI) part to learn more details.

### Validate deployment

After deployment, it's recommended to [validate key components of OpenPAI](docs/pai-management/doc/validate-deployment.md) in health status. After validation is success, [submit a hello-world job](docs/user/training.md) and check if it works end-to-end.

### Train users before "train models"

The common practice on OpenPAI is to submit job requests, and wait jobs got computing resource and executed. It's different experience with assigning dedicated servers to each one. People may feel computing resource is not in control and the learning curve may be higher than run job on dedicated servers. But shared resource on OpenPAI can improve utilization of resources and save time on maintaining environments.

For administrators of OpenPAI, a successful deployment is first step, the second step is to let users of OpenPAI understand benefits and know how to use it. Users  can learn from [Train models](#train-models). But below section of training models is for various scenarios and maybe users don't need all of them. So, administrators can create simplified documents as users' actual scenarios.

### FAQ

If there is any question during deployment, check [here](docs/faq.md#deploy-and-maintenance-related-faqs) firstly.

If FAQ doesn't resolve it, refer to [here](#get-involved) to ask question or submit an issue.

## Train models

As all computing platforms, OpenPAI is a productive tool and to maximize utilization of resources. So, it's recommended to submit training jobs and let OpenPAI to allocate resource and run jobs. If there are too many jobs, some jobs may be queued until enough resource available. This is different experience with running code on dedicated servers, so it needs a bit more knowledge about how to submit and manage jobs on OpenPAI.

Note, besides queuing jobs, OpenPAI also supports to allocate dedicated resources. Users can use SSH or Jupyter Notebook like on a physical server, refer to [here](examples/jupyter/README.md) for details. Though it's not efficient to use resources, but it also saves cost on setup and managing environments on physical servers.

### Submit training jobs

Follow [the job submission tutorial](docs/user/job_submission.md) to learn more how to train models on OpenPAI. It's a good start to learn How to use OpenPAI.

### Client tool

[OpenPAI VS Code Client](contrib/pai_vscode/VSCodeExt.md) is a friendly, GUI based client tool of OpenPAI, and it's highly recommended. It's an extension of Visual Studio Code. It can submit job, simulate jobs locally, manage multiple OpenPAI environments, and so on.

### Troubleshooting job failure

Web UI and job log are helpful to analyze job failure, and OpenPAI supports SSH for debugging.

Refer to [here](docs/user/troubleshooting_job.md) for more information about troubleshooting job failure.

## Administration

* [Manage cluster with paictl](docs/paictl/paictl-manual.md)
* [Monitoring](./docs/webportal/README.md)
* [Upgrade](./docs/upgrade/upgrade_to_v0.14.0.md)

## Reference

### Users

* [Client tool](contrib/pai_vscode/VSCodeExt.md)
* [Use Storage](docs/user/storage.md)
* [Job configuration](docs/job_tutorial.md)
* [RESTful API](docs/rest-server/API.md)
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

PAI operates in an open model. It is initially designed and developed by [Microsoft Research (MSR)](https://www.microsoft.com/en-us/research/group/systems-research-group-asia/) and [Microsoft Search Technology Center (STC)](https://www.microsoft.com/en-us/ard/company/introduction.aspx) platform team.
We are glad to have [Peking University](http://eecs.pku.edu.cn/EN/), [Xi'an Jiaotong University](http://www.aiar.xjtu.edu.cn/), [Zhejiang University](http://www.cesc.zju.edu.cn/index_e.htm), and [University of Science and Technology of China](http://eeis.ustc.edu.cn/) join us to develop the platform jointly.
Contributions from academia and industry are all highly welcome.
