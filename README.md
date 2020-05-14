# Open Platform for AI (OpenPAI) ![alt text][logo]

[logo]: ./pailogo.jpg "OpenPAI"

[![Build Status](https://travis-ci.org/microsoft/pai.svg?branch=master)](https://travis-ci.org/microsoft/pai)
[![Coverage Status](https://coveralls.io/repos/github/microsoft/pai/badge.svg?branch=master)](https://coveralls.io/github/microsoft/pai?branch=master)
[![Join the chat at https://gitter.im/Microsoft/pai](https://badges.gitter.im/Microsoft/pai.svg)](https://gitter.im/Microsoft/pai?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Version](https://img.shields.io/github/release/Microsoft/pai.svg)](https://github.com/Microsoft/pai/releases/latest)

[简体中文](README_zh_CN.md)

OpenPAI is an open source platform that provides complete AI model training and resource management capabilities, it is easy to extend and supports on-premise, cloud and hybrid environments in various scale.

**OpenPAI [v1.0.0](./RELEASE_NOTE.md#may-2020-version-100) has been released!**

A brief comparison between `v0.14.0` and `v1.0.0`:

|                   | `v0.14.0`               | `v1.0.0`               |
| ----------------- | ----------------------- | ---------------------- |
| Architecture      | Kubernetes + Hadoop YARN| Kubernetes             |
| Scheduler         | YARN Scheduler          | HiveD / K8S default    |
| Job Orchestrating | YARN Framework Launcher | Framework Controller   |
| RESTful API       | v1 + v2                 | pure v2                |
| Storage           | Team-wise storage plugin| PV/PVC storage sharing |
| Marketplace       | Marketplace v2          | openpaimarketplace     |
| SDK               | Python                  | JavaScript / TypeScript|

## Table of Contents

1. [When to consider OpenPAI](#when-to-consider-openpai)
2. [Why choose OpenPAI](#why-choose-openpai)
3. [Get started](#get-started)
    - [For cluster administrators](#for-cluster-administrators)
    - [For cluster users](#for-cluster-users)
4. [Standalone Components](#standalone-components)
5. [Reference](#reference)
6. [Related Projects](#related-projects)
7. [Get involved](#get-involved)
8. [How to contribute](#how-to-contribute)

## When to consider OpenPAI

1. When your organization needs to share powerful AI computing resources (GPU/FPGA farm, etc.) among teams.
2. When your organization needs to share and reuse common AI assets like Model, Data, Environment, etc.
3. When your organization needs an easy IT ops platform for AI.
4. When you want to run a complete training pipeline in one place.

## Why choose OpenPAI

The platform incorporates the mature design that has a proven track record in Microsoft's large-scale production environment.

#### Support on-premises and easy to deploy

   OpenPAI is a full stack solution. OpenPAI not only supports on-premises, hybrid, or public Cloud deployment but also supports single-box deployment for trial users.

#### Support popular AI frameworks and heterogeneous hardware

Pre-built docker for popular AI frameworks. Easy to include heterogeneous hardware. Support Distributed training, such as distributed TensorFlow.

#### Most complete solution and easy to extend

OpenPAI is a most complete solution for deep learning, support virtual cluster, compatible with Kubernetes eco-system, complete training pipeline at one cluster etc. OpenPAI is architected in a modular way: different module can be plugged in as appropriate. [Here](./docs/system_architecture.md) is the architecture of OpenPAI, highlighting technical innovations of the platform.

## Get started

OpenPAI manages computing resources and is optimized for deep learning. Through docker technology, the computing hardware are decoupled with software, so that it's easy to run distributed jobs, switch with different deep learning frameworks, or run other kinds of jobs on consistent environments.

As OpenPAI is a platform, there are typically two different roles:

- **Cluster users** are the consumers of the cluster's computing resources. According to the deployment scenarios, cluster users could be researchers of Machine Learning and Deep Learning, data scientists, lab teachers, students and so on.  
- **Cluster administrators** are the owners and maintainers of computing resources. The administrators are responsible for the deployment and availability of the cluster. 

OpenPAI provides end-to-end manuals for both cluster users and administrators.

### For cluster administrators

The [admin manual](https://openpai.readthedocs.io/en/latest/manual/cluster-admin/README.html) is a comprehensive guide for cluster administrators, it covers (but not limited to) the following contents:

- **Installation**. The installation is based on Kubespray, and here is the [system requirements](https://openpai.readthedocs.io/en/latest/manual/cluster-admin/installation-guide.html#installation-requirements). OpenPAI provides an [installation guide](https://openpai.readthedocs.io/en/latest/manual/cluster-admin/installation-guide.html) to facilitate the installation. 

    *If there is any question during deployment, please check [installation FAQs and troubleshooting](https://openpai.readthedocs.io/en/latest/manual/cluster-admin/installation-faqs-and-troubleshooting.html) first. If it is not covered yet, refer to [here](#get-involved) to ask question or submit an issue.*

- **Basic cluster management**. Through the Web-portal and a command-line tool `paictl`, administrators could complete [cluster managements](https://openpai.readthedocs.io/en/latest/manual/cluster-admin/basic-management-operations.html), such as [adding (or removing) nodes](https://openpai.readthedocs.io/en/latest/manual/cluster-admin/how-to-add-and-remove-nodes.html), [monitoring nodes and services](https://openpai.readthedocs.io/en/latest/manual/cluster-admin/basic-management-operations.html#management-on-webportal), and [storages setup and permission control](https://openpai.readthedocs.io/en/latest/manual/cluster-admin/how-to-set-up-storage.html).

- **Users and groups management**. Administrators could manage the [users and groups](https://openpai.readthedocs.io/en/latest/manual/cluster-admin/how-to-manage-users-and-groups.html) easily. 

- **Customization**. Administrators could customize the cluster by [plugins](https://openpai.readthedocs.io/en/latest/manual/cluster-admin/how-to-customize-cluster-by-plugins.html). Administrators could also upgrade (or downgrade) a single component (e.g. rest servers) to address customized application demands.  

### For cluster users

The [user manual](https://openpai.readthedocs.io/en/latest/manual/cluster-user/README.html) is a guidance for cluster users, who could train and serve deep learning (and other) tasks on OpenPAI.

- **Job submission and monitoring**. The [quick start tutorial](https://openpai.readthedocs.io/en/latest/manual/cluster-user/quick-start.html) is a good start for learning how to train models on OpenPAI. And more examples and supports to multiple mainstream frameworks (out-of-the-box docker images) are in [here](https://openpai.readthedocs.io/en/latest/manual/cluster-user/docker-images-and-job-examples.html). OpenPAI also provides supports for [good debuggability](https://openpai.readthedocs.io/en/latest/manual/cluster-user/how-to-debug-jobs.html) and [advanced job functionalities](https://openpai.readthedocs.io/en/latest/manual/cluster-user/advanced-jobs.html).

- **Data managements**. Users could use cluster provisioned storages and custom storages in their jobs. The cluster provisioned storages are well integrated and easy to configure in a job [(refer to here)](https://openpai.readthedocs.io/en/latest/manual/cluster-user/how-to-manage-data.html).

- **Collaboration and sharing**. OpenPAI provides facilities for collaboration in teams and organizations. The cluster provisioned storages are organized by teams (groups). And users could easily share their works (e.g. jobs) in the [marketplace](https://openpai.readthedocs.io/en/latest/manual/cluster-user/use-marketplace.html), where others could discover and reproduce (clone) by one-click.

Besides the webportal, OpenPAI provides [VS Code extension](https://openpai.readthedocs.io/en/latest/manual/cluster-user/use-vscode-extension.html) and [command line tool (preview)](https://github.com/microsoft/openpaisdk). The VS Code extension is a friendly, GUI based client tool of OpenPAI, and it's highly recommended. It's an extension of Visual Studio Code. It can submit job, simulate jobs locally, manage multiple OpenPAI environments, and so on.

## Standalone Components

With the `v1.0.0` release, OpenPAI starts using a more modularized component design and re-organize the code structure to 1 main repo together with 7 standalone key component repos. [pai](https://github.com/microsoft/pai) is the main repo, and the 7 component repos are:

  - [hivedscheduler](https://github.com/microsoft/hivedscheduler) is a Kubernetes Scheduler Extender for Multi-Tenant GPU clusters, which provides various advantages over standard k8s scheduler.
  - [frameworkcontroller](https://github.com/microsoft/frameworkcontroller) is built to orchestrate all kinds of applications on Kubernetes by a single controller.
  - [openpai-protocol](https://github.com/microsoft/openpai-protocol) is the specification of OpenPAI job protocol.
  - [openpai-runtime](https://github.com/microsoft/openpai-runtime) provides runtime support which is necessary for the OpenPAI protocol.
  - [openpaisdk](https://github.com/microsoft/openpaisdk) is a JavaScript SDK designed to facilitate the developers of OpenPAI to offer more user-friendly experience.
  - [openpaimarketplace](https://github.com/microsoft/openpaimarketplace) is a service which stores examples and job templates. Users can use it from webportal plugin to share their jobs or run-and-learn others' sharing job.
  - [openpaivscode](https://github.com/microsoft/openpaivscode) is a VSCode extension, which makes users connect OpenPAI clusters, submit AI jobs, simulate jobs locally and manage files in VSCode easily.


## Reference

* [PyTorch CIFAR-10](https://github.com/microsoft/pai/tree/pai-for-edu/contrib/edu-examples/pytorch_cifar10) and [TensorFlow CIFAR-10](https://github.com/microsoft/pai/tree/pai-for-edu/contrib/edu-examples/tensorflow_cifar10) job examples
* [RESTful API](https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/microsoft/pai/master/src/rest-server/docs/swagger.yaml)
* Design documents could be found [here](docs) if you are curious.

## Related Projects

Targeting at openness and advancing state-of-art technology, [Microsoft Research (MSR)](https://www.microsoft.com/en-us/research/group/systems-research-group-asia/) and [Microsoft Software Technology Center Asia (STCA)](https://www.microsoft.com/en-us/ard/default.aspx) had also released few other open source projects.

* [NNI](https://github.com/Microsoft/nni) : An open source AutoML toolkit for neural architecture search and hyper-parameter tuning.
We encourage researchers and students leverage these projects to accelerate the AI development and research.
* [MMdnn](https://github.com/Microsoft/MMdnn) : A comprehensive, cross-framework solution to convert, visualize and diagnose deep neural network models. The "MM" in MMdnn stands for model management and "dnn" is an acronym for deep neural network.
* [NeuronBlocks](https://github.com/Microsoft/NeuronBlocks) : An NLP deep learning modeling toolkit that helps engineers to build DNN models like playing Lego. The main goal of this toolkit is to minimize developing cost for NLP deep neural network model building, including both training and inference stages.
* [SPTAG](https://github.com/Microsoft/SPTAG) : Space Partition Tree And Graph (SPTAG) is an open source library for large scale vector approximate nearest neighbor search scenario.

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

PAI operates in an open model. It is initially designed and developed by [Microsoft Research (MSR)](https://www.microsoft.com/en-us/research/group/systems-research-group-asia/) and [Microsoft Software Technology Center Asia (STCA)](https://www.microsoft.com/en-us/ard/default.aspx) platform team.
We are glad to have [Peking University](http://eecs.pku.edu.cn/EN/), [Xi'an Jiaotong University](http://www.aiar.xjtu.edu.cn/), [Zhejiang University](http://www.cesc.zju.edu.cn/index_e.htm), and [University of Science and Technology of China](http://eeis.ustc.edu.cn/) join us to develop the platform jointly.
Contributions from academia and industry are all highly welcome.
