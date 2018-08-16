# OpenPAI FAQs

### Q: Why not recommend deploying the master node to the GPU server and running the job? 

A: It is not recommended to run the job on the master node in order to avoid overload on the master node and affect the stability of the cluster.

### Q: When OpenPAI has multiple master nodes, can the master node be deployed on multiple subnets, and they can still access normally?

A: We recommend deploying them on the same subnet. In theory, as long as the network is interoperable, it can be deployed. Considering the high communication requirements of the cluster, the network delay of different subnets is usually high, and the network is often inaccessible.

### Q: If user find a job to retry multiple times, how to diagnose the cause?

A: Users can find historical job logs through yarn. Please check [issue-1072](https://github.com/Microsoft/pai/issues/1072)'s answer. 
