# HiveDScheduler
HiveD is a [Kubernetes Scheduler Extender](https://github.com/kubernetes/community/blob/master/contributors/design-proposals/scheduling/scheduler_extender.md) for multi-tenant GPU cluster. A multi-tenant GPU cluster assumes multiple teams (tenants) share the same GPU pool in a single cluster and provides some resource gurantee to each tenant. HiveD models each tenant as a virtual (private) cluster (VC). Each tenant uses the VC as if they run a private cluster. 
 
A key feature that differentiates HiveD from a traditional multi-tenant scheduler is that HiveD provides resource guarantees to each VC in terms of "topology", instead of quota, a numeric value.  For example, a traditional scheduler allows to reserve 8 GPUs for a VC. However, it does not specify the topology of the 8 GPUs. It is possible that when a user submits an 8-GPU job that runs in a single node to that VC and the whole cluster could not find 8 GPU in a single node, because the scheduler is not aware of the topology concept for the VC reservation. HiveD allows a VC to reserve GPU in terms of "cell", a user defined topology that not only encodes the number of GPU, but also the topology and interconnection information. In the above example, user can define a cell that is a 8-GPU node, and VC can reserve one node-level cell. HiveD will ensure there always is a 8-GPU node reserved for the VC. Note that other level of cell definition is also possible, e.g., user can define a PCI-e switch level cell that ensures all GPUs are interconnected under the same PCI-e switch, or InfiniBand domain cell that all GPU servers are connected within the same IB domain.
 
HiveD also optimizes the performance for gang scheduling, a typical scheduling requirement for deep learning training job, where all containers should be available at the same time before the training job can begin. When multiple gang scheduled jobs are competing for the same set of resource, it might lead to resource starvation, where each job only gets partial resource and wait indefinitely. HiveD schedules multiple containers within a job in a transactional manner, the requirement to all containers of a job will be granted or denied at once before the resource is really being scheduled, thus avoids resource starvation. 
 
HiveD supports multiple job priorities. Higher-priority jobs can preempt lower-priority jobs. HiveD also introduces opportunistic job, the lowest priority jobs that can scavenger other VC's idle resource when possible.
 
Lastly, HiveD is fault tolerant. It can handle random machine failures and crash recovery.

## Feature
1. Multi-Tenant: Virtual Cluster (VC)
2. Fine-grained VC Quota Guarantee (VC Safety): HW Quantity, Topology, Type, etc
3. Flexible Intra-VC Job Scheduling: HW Quantity, Topology, (Any) Type, Reservation, Customization, etc
4. Few Resource Fragmentation and Starvation
5. Priority, Overuse and Inter/Intra-VC Preemption
6. Job (Full/Partial) Gang Scheduling/Preemption
7. Reconfiguration, Fault-tolerance, Bad HW Awareness, K8S Scheduler Compatible, etc

## Prerequisite
1. A Kubernetes cluster, v1.14.2 or above, on-cloud or on-premise.

## Quick Start
1. [Config Scheduler](doc/user-manual.md#ConfigQuickStart)
2. [Run Scheduler](example/run)
3. [Submit Workload to Scheduler](example/request)

## Doc
1. [User Manual](doc/user-manual.md)

## Official Image
* [DockerHub](https://hub.docker.com/u/hivedscheduler)

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
