# HDFS

This guidance provides users instructions to access the HDFS data in OpenPAI.

# Table of Content
- [ Access HDFS Data ](#Access_HDFS_Data)
    - [ WebHDFS ](#WebHDFS)
    - [ HDFS Command ](#HDFS_Command)
    - [ Web Portal ](#Web_Portal)    
    - [ API ](#API)
        - [ Java API ](#Java_API)
        - [ C API ](#C_API)
        - [ Python API](#Python_API)

# Access HDFS Data <a name="Access_HDFS_Data"></a>

Data on HDFS can be accessed by various ways. Users can choose the proper way according to there needs. For shell access, user can use [WebHDFS](#WebHDFS) and [HDFS Command](#HDFS_Command) to access HDFS data. User can also user web browser to view HDFS data through the [web portal](#Web_Portal). For accessing data from a deep learning framework, please use [HDFS API](#API) and avoid using other means for best performance as well as robustness. Note that some deep learning framework has built-in support to HDFS. For example, to train on large data, TensorFlow usually serializes the data into several big files like [TF Record](https://www.tensorflow.org/tutorials/load_data/tf_records) and it supports HDFS [natively](https://www.tensorflow.org/deploy/hadoop#hdfs). For PyTorch, it recommended to use [HDFS Python library](#Python_API) to access HDFS data during the training.

## WebHDFS <a name="WebHDFS"></a>

WebHDFS provides a set of REST APIs and this is our recommended way to access data.
[WebHDFS REST API](http://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/WebHDFS.html) contains the detailed instructions of the APIs.
In OpenPAI all the WebHDFS requests will be redirected by Pylon. We needn't directly access the name node or data node.
So the rest server URI will be http://master-node-address/webhdfs. The *master-node-address* is the address of the machine with *pai-master* label *true*
in configuration file [layout.yaml](../../examples/cluster-configuration/layout.yaml).
Following are two simple examples to show how the APIs can be used to create and delete a file.

1. Create a File<br>
Suppose to create file *test_file* under directory */test*. First step is submit a request without redirection and data with command:
```bash
curl -i -X PUT "http://master-node-address/webhdfs/api/v1/test/test_file?op=CREATE"
```
This command will return the data node where the file should be written. The location URI would be like
>http://master-node-address/a/data-node-address:5075/webhdfs/v1/test/test_file?op=CREATE&namenoderpcaddress=hdfs-name-node-address:9000&createflag=&createparent=true&overwrite=false

Then run following command with this URI to write file data:
```bash
curl -i -X PUT -T file-data-to-write "returned-location-uri"
```
Here the *returned-location-uri* is the location URI mentioned in the first command.

2. Delete a File<br>
If we want to delete the file created by above example, run following command:
```bash
curl -i -X DELETE "http://master-node-address/webhdfs/api/v1/test/test_file?op=DELETE"
```

## HDFS Command <a name="HDFS_Command"></a>

- Prepare HDFS cmd package:

The commands are available in the Hadoop package. Users can use this package in two ways.

**Method 1 (Host env):**

Please download the version you need on [Hadoop Releases](http://hadoop.apache.org/releases.html).
Then extract it to your machine by running

```bash
tar -zxvf hadoop-package-name
```

All commands are located in *bin* directory.

**Method 2 (docker container env):**

We upload a [Docker image](https://hub.docker.com/r/paiexample/pai.example.hdfs/) to DockerHub with built-in HDFS support.
    Please refer to the [HDFS commands guide](https://hadoop.apache.org/docs/r2.7.2/hadoop-project-dist/hadoop-hdfs/HDFSCommands.html) for details.

All commands are located in *bin* directory.

- How to use cmd:

Please refer [HDFS Command Guide](http://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/HDFSCommands.html) for detailed command descriptions.

- Where to get the HDFS entrypoint:

All files in the HDFS are specified by its URI following pattern *hdfs://hdfs-name-node-address:name-node-port/parent/child*.
Here the *name-node-port* is 9000. The *hdfs-name-node-address* default value is the same OpenPAI entrypoint page ip address.

Note: *hdfs-name-node-address* It is the address of the machine with *pai-master* label *true* in configuration
file [layout.yaml](../../examples/cluster-configuration/layout.yaml).
If you don't know where this file is, please contact the cluster administrator.

## Web Portal <a name="Web_Portal"></a>

Data on HDFS can be accessed by pointing your web browser to http://hdfs-name-node-address:5070/explorer.html after the cluster is ready.
The *hdfs-name-node-address* is the address of the machine with *pai-master* label *true*
in configuration file [layout.yaml](../../examples/cluster-configuration/layout.yaml).
From release 2.9.0 users can upload or delete files on the web portal. On earlier release users can only browse the data.

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
