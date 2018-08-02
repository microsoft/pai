
### Goal
Enhance YARN to support resource managerment and job scheduling of PAI.

### Architecture
YARN is the core component in Hadoop2. YARN employs master/slave architecture, called Resource Manager(RM) and Node Manager(NM) respectively. More details of YARN please refer to [official documentation](http://hadoop.apache.org/docs/current/). Some PAI function such as Virtual Cluster are based on YARN features.

We also add a [patch](https://issues.apache.org/jira/browse/YARN-7481) to enhance YARN, with which, YARN can manage more resource(GPU, port) than official version. This enchancement makes AI job scheduling possible. 

### Dependencies
Cluster-configuration(all service base), drivers(GPU support), zoopkeeper(store job status), hdfs(file system).

### Build
`
paictl.py image build -p /path/to/cluster/config -n hadoop-run
`

The command does major 3 steps:
1. Build a dev container include necessary environment. (refer to [hadoop-build](https://github.com/Microsoft/pai/tree/master/hadoop-ai/hadoop-build))
2. Run the container to build hadoop binary applied patch. (refer to [hadoop-ai](https://github.com/Microsoft/pai/tree/master/hadoop-ai))
3. Copy binary files to hadoop-run image and set related ENV. (refer to [dockerfile](https://github.com/Microsoft/pai/blob/master/pai-management/src/hadoop-run/dockerfile))

Images should also push to registry with following command for deployment.

`
paictl.py image push -p /path/to/cluster/config -n hadoop-run
`

### Configuration  
Most service configuration is the same as official hadoop, except GPU and port related items, new item's comments refer to [hadoop-ai](https://github.com/Microsoft/pai/blob/master/hadoop-ai/README.md). 


Service configuration folders are here ([RM](https://github.com/Microsoft/pai/tree/master/pai-management/bootstrap/hadoop-resource-manager/hadoop-resource-manager-configuration), [NM](https://github.com/Microsoft/pai/tree/master/pai-management/bootstrap/hadoop-node-manager/hadoop-node-manager-configuration)). We will generate these configuration files according to hardware. For advanced users, you can modify generate script under these folder to customize cluster.


### Deployment

The deployment leverages k8s Daemonset. RM first then NM.

`
paictl.py service start -p /path/to/cluster/config -n hadoop-resource-manager/hadoop-node-manager
`

The command creates k8s Daemonset to deploy service, k8s Daemonset select node according to cluster configuration.

You can also stop service similarly.


`
paictl.py service stop -p /path/to/cluster/config -n hadoop-resource-manager/hadoop-node-manager
`


**Important:** NM stop will lead all jobs on node failed!

### Refreshment

Because hadoop doesn't support modify the configuration at runtime, service should restart to refresh configuration:

* step 1: Modify configuration files as your need.
* step 2: Stop service, command refers to [Deployment](#Deployment). 
* step 3: Start service, command refers to [Deployment](#Deployment), new configuration will overwrite the old.

*Notes:* Refresh command in ` paictl.py ` for hadoop service is redundant temporarily.

### Upgrading

Either build new image by yourself or use our [pre-built images](https://hub.docker.com/r/openpai/hadoop-run/). For now, upgrading should restart related service as well.

### Service Metrics

Exported by RM webapp address (default RM_IP:8088/jmx).

Todo:
1. Export YARN Metrics in Prometheus format.

### Service Monitoring

k8s monitor.

For now, we have only readiness probe.

Todo：
1. Liveness probe.
2. Finer and more robust probe.


### High Availability

Tha major issue of YARN is the single point failure of RM, and we will solve it by configurating multi RM node, the same as official Hadoop. 

Todo:
1. Achieve HA by multi RM node.

### Runtime Requirements
For RM service, recommand to allocate at least 8G heap size (default). You can try with the default value at first, if the memory usage is close to the limitation, consider to raise it to 12G or 16G. Correspongding ENV is called YARN_RESOURCEMANAGER_HEAPSIZE in ` yarn-env.sh `.

For NM service, the ENV is YARN_NODEMANAGER_HEAPSIZE (default 4G) and you can keep it.

Todo:
1. More accurate resource requirements.
2. Automatically configurate the requirements according to cluster size.

### Other information exists in current documents, or links to existing documents.

[hadoop-ai readme](https://github.com/Microsoft/pai/blob/master/hadoop-ai/README.md)