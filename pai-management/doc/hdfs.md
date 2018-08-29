# HDFS

This guidance provides users instructions to operate the HDFS cluster in OpenPAI.

# Table of Content

- [ Goal ](#Goal)
- [ Build ](#Build)
- [ Configuration ](#Configuration)
    - [ Properties Configuration ](#Properties_Configuration)
    - [ Storage Path ](#Storage_Path)
        - [ Name Node ](#Name_Node)
        - [ Data Node ](#Data_Node)
- [ Deployment ](#Deployment)
- [ Upgrading ](#Upgrading)
- [ Service Monitoring ](#Service_Monitoring)
    - [ Metrics ](#Metrics)
    - [ Monitoring ](#Monitoring)
        - [ Monitor via Prometheus ](#Monitor_via_Prometheus)
        - [ Monitor via HTTP API ](#Monitor_via_HTTP_API)
- [ High Availability ](#High_Availability)
- [ Access HDFS Data ](#Access_HDFS_Data)
    - [ WebHDFS ](#WebHDFS)
    - [ HDFS Command ](#HDFS_Command)
    - [ Web Portal ](#Web_Portal)
    - [ Mountable HDFS ](#Mountable_HDFS)
    - [ API ](#API)
        - [ Java API ](#Java_API)
        - [ C API ](#C_API)
        - [ Python API](#Python_API)
- [ Reference ](#Reference)

# Goal <a name="Goal"></a>

 The Hadoop Distributed File System (HDFS) in OpenPAI serves as a central storage for both user's application and data.
 The application log will also be stored to HDFS.

# Build <a name="Build"></a>

The HDFS service image can be built together with other services by running this command:
```bash
python paictl.py image build -p /path/to/configuration/
```
HDFS is in the hadoop-run image, it can be built respectively with following commands:
```bash
python paictl.py image build -p /path/to/configuration/ -n hadoop-run
```

# Configuration <a name="Configuration"></a>

## Properties Configuration <a name="Properties_Configuration"></a>

HDFS name node and data node both have it configuration files.
They are located in [name node configuration](../bootstrap/hadoop-name-node/hadoop-name-node-configuration)
and [data node configuration](../bootstrap/hadoop-data-node/hadoop-data-node-configuration) respectively.
All the HDFS related properties are in file *core-site.xml* and *hdfs-site.xml*. 
Please refer [core-site.xml](https://hadoop.apache.org/docs/r2.9.0/hadoop-project-dist/hadoop-common/core-default.xml)
and [hdfs-site.xml](https://hadoop.apache.org/docs/r2.9.0/hadoop-project-dist/hadoop-hdfs/hdfs-default.xml)
for the detailed property descriptions.
  
## Storage Path <a name="Storage_Path"></a>

HDFS's data storage path on a machine is configured by *cluster.data-path* in 
file [services-configuration.yaml](../../cluster-configuration/services-configuration.yaml).
All the HDFS related data both on name node and data node will be stored under this path.

### Name Node <a name="Name_Node"></a>

* Configuration Data: Its path is defined by *hadoop-name-node-configuration* configuration map. 
* Name Data: It is in the *hdfs/name* directory under the storage path.
* Temp Data: It is in the *hadooptmp/namenode* directory under the storage path.

### Data Node <a name="Data_Node"></a>

* Configuration Data: Its path is defined by *hadoop-data-node-configuration* configuration map.
* Data Storage: It is in the *hdfs/data* directory under the storage path.
* Host Configuration: Its path is defined by *host-configuration* configuration map.
* Temp Data: It is in the *hadooptmp/datanode* directory under the storage path.

# Deployment <a name="Deployment"></a>

HDFS can be deployed when starting the OpenPAI services with command:
```bash
python paictl.py service start -p /service/configuration/path
```
The name node and data node service can be started separately by specifying the service name in the command.
```bash
python paictl.py service start -p /service/configuration/path -n hadoop-name-node
python paictl.py service start -p /service/configuration/path -n hadoop-data-node
```

# Upgrading <a name="Upgrading"></a>

It is recommended to have a backup of the name node data before upgrading the cluster.
Please refer [rolling upgrade](https://hadoop.apache.org/docs/r2.9.0/hadoop-project-dist/hadoop-hdfs/HdfsRollingUpgrade.html) for the detailed instructions.

# Service Monitoring <a name="Service_Monitoring"></a>

## Metrics <a name="Metrics"></a>
HDFS exposes various metrics for monitoring and debugging. Please refer [HDFS Metrics](https://hadoop.apache.org/docs/r2.9.0/hadoop-project-dist/hadoop-common/Metrics.html)
for all the detailed metrics and their explanations.

## Monitoring <a name="Monitoring"></a>

### Monitoring via Prometheus <a name="Monitoring_via_Prometheus"></a>

The Prometheus service will collect those metrics and monitor HDFS in real time. This is still an undergoing work.

### Monitoring via HTTP API <a name="Monitoring_via_HTTP_API"></a>

* Data Node: all the metrics can be retrieved by command
```bash
curl http://DATA_NODE_ADDRESS:50075/jmx
```

* Name Node: all the metrics can be retrieved by command
```bash
curl http://NAME_NODE_ADDRESS:50070/jmx
```

# High Availability <a name="High_Availability"></a>

Currently OpenPAI management tool doesn't deploy HDFS in a High Availability (HA) fashion. This will be added in a future release.
For solution about the HA feature please refer [HDFS High Availability](https://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/HDFSHighAvailabilityWithNFS.html).

# Access HDFS Data <a name="Access_HDFS_Data"></a>

Data on HDFS can be accessed by various ways. Users can choose the proper way according to there needs.

## WebHDFS <a name="WebHDFS"></a>

WebHDFS provides a set of REST APIs and this is our recommended way to access data.
[WebHDFS REST API](http://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/WebHDFS.html) contains the detailed instructions of the APIs.
The rest server URI is http://hdfs-name-node-address:50070. The *hdfs-name-node-address* is the address of the machine with *pai-master* label *true*
in configuration file [cluster-configuration.yaml](../../cluster-configuration/cluster-configuration.yaml).
Following are two simple examples to show how the APIs can be used to create and delete a file.

1. Create a File<br>
Suppose to create file *test_file* under directory */test*. First step is submit a request without redirection and data with command:
```bash
curl -i -X PUT "http://hdfs-name-node-address:50070/webhdfs/v1/test/test_file?op=CREATE"
```
This command will return the data node where the file should be written. The location URI would be like
>http://hdfs-name-node-address:50075/webhdfs/v1/test/test_file?op=CREATE&namenoderpcaddress=hdfs-data-node-address:9000&createflag=&createparent=true&overwrite=false

Then run following command with this URI to write file data:
```bash
curl -i -X PUT -T file-data-to-write returned-location-uri
```

2. Delete a File<br>
If we want to delete the file created by above example, run following command:
```bash
curl -i -X DELETE "http://hdfs-name-node-address:50070/webhdfs/v1/test/test_file?op=DELETE"
```

## HDFS Command <a name="HDFS_Command"></a>

The commands are available in the Hadoop package. Please download the version you need on [Hadoop Releases](http://hadoop.apache.org/releases.html).
Then extract it to your machine by running
```bash
tar -zxvf hadoop-package-name
```
All commands are located in *bin* directory.
Please refer [HDFS Command Guid](http://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/HDFSCommands.html) for detailed command descriptions.
All files in the HDFS are specified by its URI following pattern *hdfs://hdfs-name-node-address:name-node-port/parent/child*.
Here the *name-node-port* is 9000. The *hdfs-name-node-address* is the address of the machine with *pai-master* label *true* in configuration
file [cluster-configuration.yaml](../../cluster-configuration/cluster-configuration.yaml).

## Web Portal <a name="Web_Portal"></a>

Data on HDFS can be accessed by pointing your web browser to http://hdfs-name-node-address:50070/explorer.html after the cluster is ready.
The *hdfs-name-node-address* is the address of the machine with *pai-master* label *true*
in configuration file [cluster-configuration.yaml](../../cluster-configuration/cluster-configuration.yaml).
From release 2.9.0 users can upload or delete files on the web portal. On earlier release users can only browse the data.

## Mountable HDFS <a name="Mountable_HDFS"></a>

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

## API <a name="API"></a>

### Java API <a name="Java_API"></a>

The Java APIs allow users to access data from Java programs.
The detailed HDFS API interfaces can be found on [HDFS API Doc](https://hadoop.apache.org/docs/stable/api/org/apache/hadoop/fs/FileSystem.html)。

### C API <a name="C_API"></a>

The C API is provided by *libhdfs* library and it only supports a subset of the HDFS operations.
Please follow the instructions on [C APIs](http://hadoop.apache.org/docs/r2.9.1/hadoop-project-dist/hadoop-hdfs/LibHdfs.html) for details.

### Python API <a name="Python_API"></a>

The Python API can be installed with command:
```bash
pip install hdfs
```
Please refer [HdfsCLI](https://hdfscli.readthedocs.io/en/latest/) for the details.

# Reference <a name="Reference"></a>

1. [Hadoop reference doc](https://hadoop.apache.org/docs/r2.9.0/)