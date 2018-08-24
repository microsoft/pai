# Goal

 The Hadoop Distributed File System (HDFS) in OpenPAI serves as a central storage for both user's application and data.
 The application log will also be stored to HDFS.

# Build

The HDFS service image can be built together with other services by running this command:
```bash
python paictl.py image build -p /path/to/configuration/
```
HDFS is in the hadoop-run image, it can be built respectively with following commands:
```bash
python paictl.py image build -p /path/to/configuration/ -n hadoop-run
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

* Data Node: all the metrics can be retrieved by command
```bash
curl http://DATA_NODE_ADDRESS:50075/jmx
```

* Name Node: all the metrics can be retrieved by command
```bash
curl http://NAME_NODE_ADDRESS:50070/jmx
```

# High Availability

Currently OpenPAI management tool doesn't deploy HDFS in a High Availability (HA) fashion. This will be added in a future release.
For solution about the HA feature please refer [HDFS High Availability](https://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/HDFSHighAvailabilityWithNFS.html).

# Access HDFS Data

Data on HDFS can be accessed by various ways. Users can choose the proper way according to there needs.

## HDFS Command

The commands are available in the Hadoop package. Please download the version you need on [Hadoop Releases](http://hadoop.apache.org/releases.html).
Then extract it to your machine by running
```bash
tar -zxvf hadoop-package-name
```
All commands are located in *bin* directory.
Please refer [HDFS Command Guid](http://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/HDFSCommands.html) for detailed command descriptions.

## WEB Portal

Data on HDFS can be accessed by pointing your web browser to http://hdfs-name-node-ip:50070/explorer.html after the cluster is ready.
From release 2.9.0 users can upload or delete files on the web portal. On earlier release users can only browse the data.

## Mountable HDFS

The *hadoop-hdfs-fuse* tool can mount HDFS on local file system and users can access the data with Linux commands.
The tool can be installed with following commands on Ubuntu system:
```bash
# add the CDH5 repository
wget http://archive.cloudera.com/cdh5/one-click-install/trusty/amd64/cdh5-repository_1.0_all.deb
sudo dpkg -i cdh5-repository_1.0_all.deb
# install the hadoop-dfs-fuse tool
sudo apt-get update
sudo apt-get install hadoop-hdfs-fuse
# mount to local system
mkdir -p your-mount-directory
sudo hadoop-fuse-dfs dfs://hdfs-name-node-address:9000 your-mount-directory
```

## API

### Java API

The Java APIs allow users to access data from Java programs.
The detailed HDFS API interfaces can be found on [HDFS API Doc](https://hadoop.apache.org/docs/stable/api/org/apache/hadoop/fs/FileSystem.html)。

### C API

The C API is provided by *libhdfs* library and it only supports a subset of the HDFS operations.
Please follow the instructions on [C APIs](http://hadoop.apache.org/docs/r2.9.1/hadoop-project-dist/hadoop-hdfs/LibHdfs.html) for details.

### Python API

The Python API can be installed with command:
```bash
pip install hdfs
```
Please refer [HdfsCLI](https://hdfscli.readthedocs.io/en/latest/) for the details.

### Restful API

The data can also be accessed with restful APIs.
[WebHDFS REST API](http://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/WebHDFS.html) contains the detailed instructions.

# Reference

1. [Hadoop reference doc](https://hadoop.apache.org/docs/r2.9.0/)