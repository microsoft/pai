# HiveDScheduler
**HiveD is a scheduler for deep learning workloads.**

It is designed to be a [Kubernetes Scheduler **Extender**](https://github.com/kubernetes/community/blob/master/contributors/design-proposals/scheduling/scheduler_extender.md) for **multi-tenant** **GPU** cluster. A multi-tenant GPU cluster assumes multiple tenants (teams) share the same GPU pool in a single physical cluster (PC) and provides some resource guarantees to each tenant. HiveD models each tenant as a virtual cluster (VC), so that one tenant can use its own VC as if it is a private cluster, while it can also use other VCs' free resource at lower priority. 

A key feature that differentiates HiveD from a traditional multi-tenant scheduler is that HiveD can provide resource guarantee to each VC, not only in terms of quantity, a numeric value, but also in terms of **[topology](example/feature/README.md#VC-Safety)**. For example, a traditional scheduler reserves 8 GPUs for a VC. However, it does not know the topology of these 8 GPUs. It is possible that a 8-GPU container (or job) which has to run within a single node, cannot be allocated even if its VC still has 8 free GPUs. This is because these 8 free GPUs may belong to multiple nodes. HiveD allows a VC to reserve GPUs in terms of cell, a user defined resource type that not only encodes the quantity of GPUs, but also other kinds of information, such as their hardware type and topology. In the above example, user can define a 8-GPU node level cell, and the VC can reserve one of this cell. Then, HiveD will ensure that there is always one 8-GPU node reserved for the VC. Note that other level of cell definition is also possible. For example, user can define a PCI-e switch level cell that ensures all GPUs are interconnected under the same PCI-e switch, or an InfiniBand domain cell that ensures all GPU nodes are connected within the same InfiniBand domain.

HiveD also optimizes the performance for **[gang scheduling](example/feature/README.md#Gang-Scheduling)**, a typical scheduling requirement for deep learning training job, where all containers should be allocated before the training job can begin. When multiple gang scheduling jobs are competing for the same set of resource, it may lead to resource starvation, where each job only gets partial resource and wait indefinitely. HiveD can schedule all containers within a job in a transactional manner, i.e. all these containers' requirements will be granted or denied as a whole, thus avoids resource starvation and partial resource allocation.

HiveD supports multiple job **priorities**. Higher-priority jobs can **[preempt](example/feature/README.md#Intra-VC-Preemption)** lower-priority jobs. HiveD also introduces **[opportunistic job](example/feature/README.md#Opportunistic-Job)**, i.e. the lowest priority jobs that can use other VCs' free resource when possible.

Lastly, HiveD is **fault-tolerant**. It can handle random machine failures and crash recovery.

## Feature
1. [Multi-Tenant: Virtual Cluster (VC)](example/feature/README.md#VC-Safety)
2. [Fine-grained VC Quota Guarantee (VC Safety)](example/feature/README.md#VC-Safety): HW Quantity, [Topology](example/feature/README.md#VC-Safety), [Type](example/feature/README.md#GPU-Type), [Reservation](example/feature/README.md#Reservation), etc.
3. Flexible Intra-VC Job Scheduling: HW Quantity, [Topology](example/feature/README.md#Topology-Aware-Scheduling), [(Any) Type](example/feature/README.md#GPU-Type), [Reservation](example/feature/README.md#Reservation), Customization, etc
4. Few Resource Fragmentation and Starvation
5. [Priority](example/feature/README.md#Guaranteed-Job), [Overuse](example/feature/README.md#Opportunistic-Job) and [Inter](example/feature/README.md#Inter-VC-Preemption)/[Intra-VC Preemption](example/feature/README.md#Intra-VC-Preemption)
6. [Job (Full/Partial) Gang Scheduling/Preemption](example/feature/README.md#Gang-Scheduling)
7. [Work Preserving Reconfiguration](example/feature/README.md#Work-Preserving-Reconfiguration), [Bad HW Awareness](example/feature/README.md#Bad-Hardware-Awareness), [Leverage K8S Default Scheduler](example/feature/README.md#Leverage-K8S-Default-Scheduler), Fault-tolerance, etc

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

## Related Project
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
