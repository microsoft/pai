
### Goal

Provide a centralized service for maintaining configuration information and distributed synchronization. 

### Architecture

Zookeeper architecture please refer to http://zookeeper.apache.org/ and we don't add any patch.

Job status and HA sync info are stored in zookeeper to avoid out-of-sync.

### Dependencies

Cluster-configuration

### Build

* By ` paictl.py `

`
paictl.py image build -p /path/to/cluster/config -n zookeeper
`

`
paictl.py image push -p /path/to/cluster/config -n zookeeper
`

* Manual build

refer to [dockerfile](https://github.com/Microsoft/pai/blob/master/pai-management/src/zookeeper/dockerfile)


### Configuration  

Configuration file is [here](https://github.com/Microsoft/pai/blob/master/pai-management/src/zookeeper/zoo.cfg), you can keep it in most cases.


### Reconfiguration

Stop and restart to update configuration. Refresh command in ` paictl.py ` for zookeeper is redundant temporarily.

### Deployment

Deployed by k8s Daemonset.

`
paictl.py service start -p /path/to/cluster/config -n zookeeper
`

The command creates k8s Daemonset to deploy service, which select node with zookeeper role to start service.

You can also stop service similarly.

`
paictl.py service stop -p /path/to/cluster/config -n zookeeper
`

### Upgrading

Either build new image by yourself or use our [prebuild images](https://hub.docker.com/r/openpai/zookeeper/). For now, upgrade should restart related service.

### Service Metrics

Exported by zookeeper

`
echo mntr | nc zookeeper_IP 2185
`

### Service Monitoring

k8s monitor.

For now, we have only readiness probe.


### High Availability

Zookeeper support HA inherently.

### Runtime Requirements

Memory limits(at least 1G)


