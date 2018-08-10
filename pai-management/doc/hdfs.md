# Goal

 The HDFS service in OpenPAI servers as a central storage for both user's application and data.
 The application log will also be stored to HDFS.

# Build

The HDFS service image can be built together with other services by running this command:
```bash
python paictl.py image build -p /path/to/configuration/
```
The name node and data node service can be built respectively with following commands:
```bash
python paictl.py image build -p /path/to/configuration/ -n hadoop-name-node
python paictl.py image build -p /path/to/configuration/ -n hadoop-data-node
```

# Configuration

## Properties Configuration

HDFS name node and data node both have it configuration files.
They are located in [name node configuration](../bootstrap/hadoop-name-node/hadoop-name-node-configuration)
and [data node configuration](../bootstrap/hadoop-data-node/hadoop-data-node-configuration) respectively.
All the HDFS related properties are in file *core-site.xml* and *hdfs-site.xml*. 
Please refer [core-site.xml](https://hadoop.apache.org/docs/r2.9.0/hadoop-project-dist/hadoop-common/core-default.xml)
and [hdfs-site.xml](https://hadoop.apache.org/docs/r2.9.0/hadoop-project-dist/hadoop-hdfs/hdfs-default.xml)
for the detailed property descriptions.
  
## Storage Path

HDFS's data storage path on a machine is configured by *cluster.data-path* in 
file [services-configuration.yaml](../../cluster-configuration/services-configuration.yaml).
All the HDFS related data both on name node and data node will be stored under this path.

### Name Node

* Configuration Data: Its path is defined by *hadoop-name-node-configuration* configuration map. 
* Name Data: It is in the *hdfs/name* directory under the storage path.
* Temp Data: It is in the *hadooptmp/namenode* directory under the storage path.

### Data Node

* Configuration Data: Its path is defined by *hadoop-data-node-configuration* configuration map.
* Data Storage: It is in the *hdfs/data* directory under the storage path.
* Host Configuration: Its path is defined by *host-configuration* configuration map.
* Temp Data: It is in the *hadooptmp/datanode* directory under the storage path.

# Deployment

HDFS can be deployed when starting the OpenPAI services with command:
```bash
python paictl.py service start -p /service/configuration/path
```
The name node and data node service can be started separately by specifying the service name in the command.
```bash
python paictl.py service start -p /service/configuration/path -n hadoop-name-node
python paictl.py service start -p /service/configuration/path -n hadoop-data-node
```

# Upgrading

It is recommended to have a backup of the name node data before upgrading the cluster.
Please refer [rolling upgrade](https://hadoop.apache.org/docs/r2.9.0/hadoop-project-dist/hadoop-hdfs/HdfsRollingUpgrade.html) for the detailed instructions.

# Service Monitoring

## Metrics
HDFS exposes various metrics for monitoring and debugging. Please refer [HDFS Metrics](https://hadoop.apache.org/docs/r2.9.0/hadoop-project-dist/hadoop-common/Metrics.html)
for all the detailed metrics and their explanations.

## Monitoring

### Monitoring via Prometheus

The Prometheus service will collect those metrics and monitor HDFS in real time. This is still an undergoing work.

### Monitoring via HTTP API

* Data Node: On data node all the metrics can be retrieved by command
```bash
curl http://10.151.40.179:50075/jmx
```

* Name Node: On name node all the metrics can be retrieved by command
```bash
curl http://10.151.40.179:50070/jmx
```

# High Availability

Currently OpenPAI management tool doesn't deploy HDFS in a High Availability (HA) fashion. This will be added in a feature release.
For solution about the HA feature please refer [HDFS High Availability](https://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/HDFSHighAvailabilityWithNFS.html).

# Reference

1. [Hadoop reference doc](https://hadoop.apache.org/docs/r2.9.0/)