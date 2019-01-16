### Goal
Enhance YARN to support resource management and job scheduling of PAI.

### Architecture
YARN is the core component in Hadoop2. YARN employs master/slave architecture, 
called Resource Manager(RM) and Node Manager(NM) respectively. 
More details of YARN please refer to [official documentation](http://hadoop.apache.org/docs/current/). 
Some PAI function such as Virtual Cluster are based on YARN features.

We also add a [patch](https://issues.apache.org/jira/browse/YARN-7481) to enhance YARN, 
with which, YARN can manage more resource(GPU, port) than official version. 
This enhancement makes AI job scheduling possible. 

### Dependencies
Cluster-configuration(all service base), drivers(GPU support), zoopkeeper(store job status), hdfs(file system).

### Build
```bash
python pai_build.py build -c /path/to/configuration/ -s hadoop-run
```

The command does major 3 steps:
1. Build a dev container include necessary environment. 
2. Run the container to build patched hadoop binary. 
3. Copy binary files to hadoop-run image and set related ENV. 

Images should also be pushed to registry with following command for deployment.

```bash
python pai_build.py push -c /path/to/configuration/ -i hadoop-run
```

### Configuration  
Most service configuration are the same as official hadoop, except GPU and port related items, 
for these extra items, please refer to [hadoop-ai](../hadoop-ai/README.md). 


YARN configuration files([RM](../../src/hadoop-resource-manager/deploy/hadoop-resource-manager-configuration), 
[NM](../../src/hadoop-node-manager/deploy/hadoop-node-manager-configuration)) 
will be generated according to [setting](../../deployment/quick-start) and hardware when service starts. 
Advanced users can modify related scripts under these folder to customize cluster.


### Deployment

YARN deployment leverages k8s Daemonset. RM first then NM:

```bash
paictl.py service start -n hadoop-resource-manager/hadoop-node-manager
```

This command creates a k8s Daemonset, 
which selects node according to cluster configuration to deploy corresponding service.

You can also stop service similarly.

```bash
paictl.py service stop -n hadoop-resource-manager/hadoop-node-manager
```



### Refreshment

Currently, service should restart to refresh configuration:

* step 1: Modify configuration files as your need.
* step 2: Stop service, command refers to [Deployment](#Deployment). 
* step 3: Start service, command refers to [Deployment](#Deployment), new configuration will overwrite the old.


Take VC updating as an example:

VC feature leverages YARN scheduler queue, allows admin to split resources into multiple parts.
By default, there is only one VC called `default`, 
which take up 100% resources, related fields in `services-configuration.yaml` look like follows.
```yaml
virtualClusters:
  default:
    description: Default VC.
    capacity: 100
```
If admin wants to reserve some resources for other usage, 
a new VC(i.e., vc1) can be added:
* step 1: Create a new VC called `vc1`, allocate a certain quota for it, 
```yaml
virtualClusters:
  default:
    description: Default VC.
    capacity: 70
  vc1:
    capacity: 30
```
* step 2: Stop RM, `paictl.py service stop -p /path/to/cluster/config -n hadoop-resource-manager`
* step 3: Restart RM, `paictl.py service start -p /path/to/cluster/config -n hadoop-resource-manager`

Then, `vc1` will be available in webportal. 
Similarly, admin can change VC quotas or delete a VC, 
for deletion scenario, all running jobs under deleted VC should be stopped firstly.
**During entire refreshment, admin must ensure the sum of all VC capacity equals to 100.**

Todo:
1. For items supporting configured at runtime, avoid restarting service to refresh.
2. Automatic refreshment.

### Upgrading

Either build new image by yourself or use our [pre-built images](https://hub.docker.com/r/openpai/hadoop-run/). 
Currently, upgrading should restart related service as well.

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

Tha major issue of YARN is the single point failure of RM, 
and we will solve it by multi RM node, the same as official Hadoop. 

Todo:
1. Achieve HA by multi RM node.

### Runtime Requirements
For RM service, we recommend to allocate at least 8G heap size (default). 
You can try with the default value at first, 
if the memory usage is close to the limitation, consider to raise it to 12G or 16G. 
Corresponding ENV is called `YARN_RESOURCEMANAGER_HEAPSIZE` in ` yarn-env.sh `.

For NM service, the ENV is `YARN_NODEMANAGER_HEAPSIZE` (default 4G) and you can keep it.

Todo:
1. More accurate resource requirements.
2. Automatically configured the requirements according to cluster size.
