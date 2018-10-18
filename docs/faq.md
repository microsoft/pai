# OpenPAI FAQs

### Q: Why not recommend deploying the master node to the GPU server and running the job?

A: It is not recommended to run the job on the master node in order to avoid overload on the master node and affect the stability of the cluster.

### Q: When OpenPAI has multiple master nodes, can the master node be deployed on multiple subnets, and they can still access normally?

A: We recommend deploying them on the same subnet. In theory, as long as the network is interoperable, it can be deployed. Considering the high communication requirements of the cluster, the network delay of different subnets is usually high, and the network is often inaccessible.

### Q: If user find a job to retry multiple times, how to diagnose the cause?

A: Users can find historical job logs through yarn. Please check [issue-1072](https://github.com/Microsoft/pai/issues/1072)'s answer and [job_log.md](./job_log.md)'s introduction.

### Q: How to diagnose job problems through logs?

A: Please check [job_log.md](./job_log.md)'s introduction.

### Q: To improve the cluster usage, user would like to see a VC can use up all cluster resource if others don’t use it.

A: By default, a VC can use up all cluster resource if others don’t use it. OpenPAI use [capacity scheduler](https://hadoop.apache.org/docs/r1.2.1/capacity_scheduler.html) of YARN for resource allocation. maximum-capacity defines a limit beyond which a queue cannot use the capacity of the cluster. This provides a means to limit how much excess capacity a queue can use. Default value of -1 implies a queue can use complete capacity of the cluster. [OpenPAI capacity scheduler](../src/hadoop-resource-manager/deploy/hadoop-resource-manager-configuration/capacity-scheduler.xml.template) not set this item and there is no limit.

### Q: To ensure one user cannot occupy excessive resource, operator would like to set a quota constraint for individual users.

A: OpenPAI use capacity scheduler of YARN for resource allocation. User can configure the items "[yarn.scheduler.capacity.root.{{ queueName }}.user-limit-factor, yarn.scheduler.capacity.root.{{ queueName }}.minimum-user-limit-percent](https://hadoop.apache.org/docs/r1.2.1/capacity_scheduler.html)" to control the user's resource quota. These configuration items are in this file [capacity-scheduler.xml.template](../src/hadoop-resource-manager/deploy/hadoop-resource-manager-configuration/capacity-scheduler.xml.template) of OpenPAI.

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
- OpenPAI default value of 100 implies no user limits are imposed.
- Official explanation:

```
The multiple of the queue capacity which can be configured to allow a single user to acquire more slots. By default this is set to 1 which ensure that a single user can never take more than the queue's configured capacity irrespective of how idle th cluster is.
```

- Note: This configuration control user's resource usage which exceeds current vc. VC a can preempt the resources occupied by VC b, before job is completed.

For yarn.scheduler.capacity.root.{{ queueName }}.minimum-user-limit-percent:
- OpenPAI's default value of 100 implies no user limits are imposed.
- Official explanation:

```
Each queue enforces a limit on the percentage of resources allocated to a user at any given time, if there is competition for them. This user limit can vary between a minimum and maximum value. The former depends on the number of users who have submitted jobs, and the latter is set to this property value. For example, suppose the value of this property is 25. If two users have submitted jobs to a queue, no single user can use more than 50% of the queue resources. If a third user submits a job, no single user can use more than 33% of the queue resources. With 4 or more users, no user can use more than 25% of the queue's resources. A value of 100 implies no user limits are imposed.
```

- Note:  This configuration control users' resource usage in current vc. User a can not preempt the resources occupied by user b before job is completed.

### Q: How to configure virtual cluster capacity?

A: Please refer [configure virtual cluster capacity](./pai-management/doc/how-to-write-pai-configuration.md#configure_vc_capacity)

### Q: How to use private docker registry job image when submitting an OpenPAI job?

A: Please refer [job_tutorial.md](./job_tutorial.md) to config the auth file at job submit json file:

If you're using a private Docker registry which needs authentication for image pull and is different from the registry used during deployment,
please create an authentication file in the following format, upload it to HDFS and specify the path in `authFile` parameter in config file.

- (1) Create an authFile

authfile content:

```
userprivateimage.azurecr.io
username
password
```

Note: userprivateimage.azurecr.io is docker_registry_server

- (2) [Upload it to HDFS](./hadoop/hdfs.md#WebHDFS).

File path at hdfs example: hdfs://master_ip:9000/user/paidemo/authfile

- (3) Specify the path in `authFile` paramete

OpenPAI job json file example:

```
{
  "jobName": "paidemo",
  "image": "userprivateimage.azurecr.io/demo4pai:test",
  "dataDir": "hdfs://master_ip:9000/user/paidemo/data",
  "outputDir": "hdfs://master_ip:9000/user/paidemo/output",
  "codeDir": "hdfs://master_ip:9000/user/paidemo/code",
  "authFile":"hdfs://master_ip:9000/user/paidemo/authfile",
  "taskRoles": [
    {
      "name": "demo4pai",
      "taskNumber": 1,
      "cpuNumber": 2,
      "memoryMB": 8192,
      "gpuNumber": 1,
      "command": " cd /home/test && bash train.sh"
    }
  ]
}
```

*NOTE*:
- If you're using a private registry at Docker Hub, you should use `docker.io` for `docker_registry_server` field in the authentication file.
- Related issue: [1125](https://github.com/Microsoft/pai/issues/1215)

### Q: How many jobs does PAI support?

A: According to the default configuration, PAI supports 60k jobs, including waiting/running/finished jobs.

The limitation is because we only reserve so much memory resource for `PAI services`, it may be enough in typical scenario.

For example, user may have hundreds jobs running, thousands jobs waiting, and tens of thousands jobs finished.

