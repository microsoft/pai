# HiveD Scheduler
**HiveD is a scheduler for deep learning workloads.**

It is designed to be a [Kubernetes Scheduler **Extender**](https://github.com/kubernetes/community/blob/master/contributors/design-proposals/scheduling/scheduler_extender.md) for **Multi-Tenant** **GPU** clusters. A multi-tenant GPU cluster assumes multiple tenants (teams) share the same GPU pool in a single physical cluster (PC) and provides some resource guarantees to each tenant. HiveD models each tenant as a virtual cluster (VC), so that one tenant can use its own VC as if it is a private cluster, while it can also use other VCs' free resource at lower priority. 

## Why You Need HiveD

HiveD provides essential features for deep learning workloads as follows.

### Topology-Aware Resource Guarantee

A key feature that differentiates HiveD from a traditional multi-tenant scheduler is that HiveD can provide resource guarantee to each VC, not only in terms of quantity, a numeric value, but also in terms of **[topology](example/feature/README.md#VC-Safety)**. For example, a traditional scheduler guarantees that a VC can use 8 GPUs. However, it does not know the topology of these 8 GPUs. It is possible that an 8-GPU training job which has to run within a single node, cannot be allocated even if its VC still has 8 free GPUs. This is because these 8 free GPUs may belong to multiple nodes in the physical cluster.

HiveD provides VCs with resource guarantees in terms of **cell**, a user-defined resource type that encodes both the quantity and the topology of the GPUs (among other specific hardware configurations, such as GPU type, networking). In the above example, a user can define a cell type of 8-GPU node, and the VC can be assigned one of such cell. Then, HiveD will ensure that *there is always one 8-GPU node available for the VC*, regardless of the other workloads in the cluster.

HiveD allows flexible cell definitions and assignments. For example, users can define cells at multiple topology levels (e.g., PCI-e switch). Users can also create different cell types for different GPU models (e.g., V100) or networking configuration (e.g.,InfiniBand domain) in a heterogeneous cluster. HiveD can then provide fine-grained resource guarantees with the cells.

### Gang Scheduling

HiveD optimizes the performance of **[gang scheduling](example/feature/README.md#Gang-Scheduling)**, a typical scheduling requirement for deep learning training jobs, where all containers should be allocated before the training job can begin. Multiple gang-scheduled jobs competing for the same set of resource may lead to starvation, where each job only gets partial resource and has to wait indefinitely.

HiveD schedules all containers within a job in a *transactional* manner, i.e., all these containers' requirements will be granted or denied as a whole, thus avoiding partial resource allocation and starvation.

### Priorities

HiveD supports multiple job **priorities**. Higher-priority jobs can **[preempt](example/feature/README.md#Intra-VC-Preemption)** lower-priority jobs. HiveD also introduces **[opportunistic jobs](example/feature/README.md#Opportunistic-Job)**, i.e., jobs with lowest priority which can use other VCs' free resource when possible (without breaking the resource guarantees to other VCs).

### Fault-Tolerance

HiveD is **fault-tolerant**. It can candle random failures of both the scheduler itself and the resource it manages.

## Features
1. [Multi-tenancy: Virtual Cluster (VC)](example/feature/README.md#VC-Safety)
2. [Fine-grained VC resource guarantee](example/feature/README.md#VC-Safety): Quantity, [Topology](example/feature/README.md#VC-Safety), [Type](example/feature/README.md#GPU-Type), [Static Reservation](example/feature/README.md#Reservation), etc.
3. Flexible intra-VC scheduling: [Topology-awareness](example/feature/README.md#Topology-Aware-Scheduling), [Flexible GPU types](example/feature/README.md#GPU-Type), [Reservation](example/feature/README.md#Reservation), Scheduling policy customization, etc.
4. Optimized resource fragmentation and less starvation
5. [Priorities](example/feature/README.md#Guaranteed-Job), [Opportunistic jobs](example/feature/README.md#Opportunistic-Job) and [Inter-](example/feature/README.md#Inter-VC-Preemption)/[Intra-VC preemption](example/feature/README.md#Intra-VC-Preemption)
6. [Job (Full/Partial) gang scheduling/preemption](example/feature/README.md#Gang-Scheduling)
7. Scheduler fault-tolerance, [Hardware failure-awareness](example/feature/README.md#Bad-Hardware-Awareness), [Work preserving reconfiguration](example/feature/README.md#Work-Preserving-Reconfiguration)
8. [Leverage K8s default scheduler](example/feature/README.md#Leverage-K8S-Default-Scheduler)

## Prerequisite
1. A Kubernetes cluster, v1.14.2 or above, on-cloud or on-premise.

## Quick Start
1. [Config Scheduler](doc/user-manual.md#ConfigQuickStart)
2. [Run Scheduler](example/run)
3. [Submit Workload to Scheduler](example/request)

## Doc
1. [User Manual](doc/user-manual.md)
2. [Feature Demo](example/feature/README.md)

## Official Image
* [DockerHub](https://hub.docker.com/u/hivedscheduler)

## Related Projects
* [FrameworkController](https://github.com/microsoft/frameworkcontroller): A General-Purpose Kubernetes Pod Controller, which can easily leverage HiveD to schedule jobs .
* [OpenPAI](https://github.com/microsoft/pai): A complete solution for AI platform, which makes HiveD more user friendly.

## Contributing
This project welcomes contributions and suggestions. Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
