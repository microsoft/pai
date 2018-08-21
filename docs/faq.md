# OpenPAI FAQs

### Q: Why not recommend deploying the master node to the GPU server and running the job? 

A: It is not recommended to run the job on the master node in order to avoid overload on the master node and affect the stability of the cluster.

### Q: When OpenPAI has multiple master nodes, can the master node be deployed on multiple subnets, and they can still access normally?

A: We recommend deploying them on the same subnet. In theory, as long as the network is interoperable, it can be deployed. Considering the high communication requirements of the cluster, the network delay of different subnets is usually high, and the network is often inaccessible.

### Q: If user find a job to retry multiple times, how to diagnose the cause?

A: Users can find historical job logs through yarn. Please check [issue-1072](https://github.com/Microsoft/pai/issues/1072)'s answer.

### Q: To improve the cluster usage, user would like to see a VC can use up all cluster resource if others don’t use it.

A: By default, a VC can use up all cluster resource if others don’t use it. OpenPAI use [capacity scheduler](https://hadoop.apache.org/docs/r1.2.1/capacity_scheduler.html) of YARN for resource allocation. maximum-capacity defines a limit beyond which a queue cannot use the capacity of the cluster. This provides a means to limit how much excess capacity a queue can use. Default value of -1 implies a queue can use complete capacity of the cluster. [OpenPAI capacity scheduler](../pai-management/bootstrap/hadoop-resource-manager/hadoop-resource-manager-configuration/capacity-scheduler.xml.template) not set this item and there is no limit. 

### Q: To ensure one user cannot occupy excessive resource, operator would like to set a quota constraint for individual users. 

A: OpenPAI use capacity scheduler of YARN for resource allocation. User can configure the items "[yarn.scheduler.capacity.root.{{ queueName }}.user-limit-factor, yarn.scheduler.capacity.root.{{ queueName }}.minimum-user-limit-percent](https://hadoop.apache.org/docs/r1.2.1/capacity_scheduler.html)" to control the user's resource quota. These configuration items are in this file [capacity-scheduler.xml.template](../pai-management/bootstrap/hadoop-resource-manager/hadoop-resource-manager-configuration/capacity-scheduler.xml.template) of OpenPAI.

```xml
  <property>
    <name>yarn.scheduler.capacity.root.{{ queueName }}.user-limit-factor</name>
    <value>100</value>
  </property>

  <property>
    <name>yarn.scheduler.capacity.root.{{ queueName }}.minimum-user-limit-percent</name>
    <value>100</value>
  </property>
```

For yarn.scheduler.capacity.root.{{ queueName }}.user-limit-factor:
By default this is set to 1 which ensure that a single user can never take more than the queue's configured capacity irrespective of how idle th cluster is.

For yarn.scheduler.capacity.root.{{ queueName }}.minimum-user-limit-percent:
Default value of 100 implies no user limits are imposed.

