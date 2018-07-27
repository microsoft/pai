
### Goal
Custom Yarn to support different resource allocation (CPU, GPU, Memory, Port) and various kinds job scheduler(Machine Learning, Spark). In the single point of failure, Yarn should also provide reliable service and shouldn't impact exist jobs.

### Architecture
Yarn is the core component in Hadoop2, and we add a [patch](https://issues.apache.org/jira/browse/YARN-7481) to enhance it. 

Yarn employs master/slave architecture, called Resource Manager(RM) and Node Manager(NM) respectively. More details of Yarn please refer to [official documentation](http://hadoop.apache.org/docs/current/).

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

Images should also push to registry for deployment.

`
paictl.py image push -p /path/to/cluster/config -n hadoop-run
`

### Configuration  
Most service configuration is the same as official hadoop, except GPU and port related items, new item's comments refer to [hadoop-ai](https://github.com/Microsoft/pai/blob/master/hadoop-ai/README.md). 


Service configuration folders are here ([RM](https://github.com/Microsoft/pai/tree/master/pai-management/bootstrap/hadoop-resource-manager/hadoop-resource-manager-configuration), [NM](https://github.com/Microsoft/pai/tree/master/pai-management/bootstrap/hadoop-node-manager/hadoop-node-manager-configuration)). We will generate these configuration files according to hardware. For advanced users, you can modify generate script under these folder to custom cluster.

### Reconfiguration

Because hadoop doesn't support modify the configuration at runtime, service should stop and restart to update configuration. Refresh command in ` paictl.py ` for hadoop service is redundant temporarily.

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

### Upgrading

Either build new image by youself or use our [prebuild images](https://hub.docker.com/r/openpai/hadoop-run/). For now, upgrade should restart related service, which means all jobs will fail.

### Service Metrics

Exported by RM webapp address (default RM_IP:8088/jmx)

### Service Monitoring

k8s monitor.

For now, we have only readiness probe.


### High Availability

Similar to official hadoop, achieve HA by multi RM node.

### Runtime Requirements
For RM service, recommand to allocate at least 8G heap size (default). For large cluser, consider to raise it to 12G or 16G. Correspongding ENV is called YARN_RESOURCEMANAGER_HEAPSIZE in ` yarn-env.sh `.

For NM service, the ENV is YARN_NODEMANAGER_HEAPSIZE (default 4G) and you can keep it.

### Other information exists in current documents, or links to existing documents.

[hadoop-ai readme](https://github.com/Microsoft/pai/blob/master/hadoop-ai/README.md)