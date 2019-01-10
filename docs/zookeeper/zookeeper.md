### Goal

Provide a centralized service for maintaining configuration information and distributed synchronization. 

### Architecture

ZooKeeper architecture please refer to http://zookeeper.apache.org/ and we don't add any patch.

Job status and HA sync info are stored in ZooKeeper to avoid out-of-sync.

### Dependencies

Cluster-configuration.

### Build

* By ` paictl.py `

`
paictl.py image build -p /path/to/cluster/config -n zookeeper
`

`
paictl.py image push -p /path/to/cluster/config -n zookeeper
`

* Manual build

refer to [dockerfile](../../src/zookeeper/build/zookeeper.dockerfile).


### Configuration  

Configuration file is [here](../../src/zookeeper/deploy/zk-configuration/zoo.cfg), you can keep it in most cases.


### Deployment

Deployed by k8s Daemonset.

`
paictl.py service start -p /path/to/cluster/config -n zookeeper
`

The command creates k8s Daemonset to deploy service, which select node with ZooKeeper role to start service.

You can also stop service similarly.

`
paictl.py service stop -p /path/to/cluster/config -n zookeeper
`

### Refreshment

Stop and restart to update configuration, related commands refer to [Deployment](#Deployment). 

*Notes:* Refresh command in ` paictl.py ` for ZooKeeper is redundant temporarily.

### Upgrading

Either build new image by yourself or use our [pre-built images](https://hub.docker.com/r/openpai/zookeeper/). For now, upgrade should restart related service as well.

### Service Metrics

Exported by ZooKeeper

`
echo mntr | nc ZooKeeper_IP 2181
`

Todo:
1. Export ZooKeeper Metrics in Prometheus format.

### Service Monitoring

k8s monitor.

For now, we have only readiness probe.

Todo：
1. Liveness probe.
2. Finer and more robust probe.


### High Availability

ZooKeeper support HA inherently.

Todo:
1. Achieve HA by multi ZooKeeper node.

### Runtime Requirements

Memory limits(at least 1G)

Todo:
1. More accurate resource requirements.


