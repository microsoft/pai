# HivedScheduler
A [Kubernetes Scheduler Extender](https://github.com/kubernetes/community/blob/master/contributors/design-proposals/scheduling/scheduler_extender.md) optimized for GPUs.

*TODO: Add Features, Architecture and UserManual*

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
