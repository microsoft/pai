# OpenPAI FAQs

### Q: Why does not suggest master node deploy on GPU server (Doesn't suggest matser execute jobs)? 

A: Separation of the working node and the master node is a good choice. It is not recommended to run the job on the master node in order to avoid overload on the master node and affect the stability of the cluster.

### Q: Can it be deployed normally when OpenPAI container multi masters, they are in different network segments and they could access each other?

A: We recommend deploying them in a subnet. In theory, network interoperability can be deployed, but considering the high internal communication requirements of the cluster, in general the delay between different network segments is relatively long and network isolation is more likely to occur. 

