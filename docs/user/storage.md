# How to use storage

- [How to use storage](#how-to-use-storage)
  - [Why care about storage](#why-care-about-storage)
  - [General practice](#general-practice)
  - [Approaches](#approaches)
    - [Sharing](#sharing)
    - [Copy](#copy)
    - [Docker Built-in](#docker-built-in)
  - [In cloud (Azure)](#in-cloud-azure)
  - [Many small files](#many-small-files)
  - [Large file size](#large-file-size)
  - [HDFS in OpenPAI](#hdfs-in-openpai)

## Why care about storage

OpenPAI manages computing resources, but it doesn't offer persistent storage for data, code, or model files. Training jobs on OpenPAI runs in docker containers, which are fresh environments and will be destroyed once completed. So, a job of OpenPAI should prepare files first, and may save output files out before the environment destroyed.

This article introduces how to access files on OpenPAI, and it's no difference with general Docker practice.

## General practice

Below job configuration is similar with the [hello-world example](training.md#submit-a-hello-world-job), except the command field. The command field uses code in a shared folder instead from GitHub and it saves outputs back to the folder.

Note, this example uses a windows shared folder. [Samba](https://www.samba.org/) supports the shared folder on Linux. If you'd like to have a try, it needs to,

1. Clone [corresponding code](https://github.com/tensorflow/models) and share the folder.
2. Fill all statements, with corresponding value, including `<AddressOfSharedServer>`, `<SharedFolder>`, `<Username>`, and `<Password>`.

```json
{
"jobName": "tensorflow-cifar10",
"image": "tensorflow/tensorflow:1.12.0-gpu-py3",
"taskRoles": [
    {
    "name": "default",
    "taskNumber": 1,
    "cpuNumber": 4,
    "memoryMB": 8192,
    "gpuNumber": 1,
    "command": "apt update && apt install -y cifs-utils && mkdir /models && mount -t cifs //<AddressOfSharedServer>/<SharedFolder> /models -o username=<Username>,password=<Password> && cd /models/research/slim && python3 download_and_convert_data.py --dataset_name=cifar10 --dataset_dir=/tmp/data && python3 train_image_classifier.py --dataset_name=cifar10 --dataset_dir=/tmp/data --train_dir=/tmp/output --max_number_of_steps=1000 && cp -rf /tmp/output /models/output"
    }
]
}
```

The command field can be split to below general steps.

1. **Prepare environment**. The docker image prepares most dependencies. But if the job needs more components, it can be installed by apt, pip or other command. In this example, `apt update && apt install -y cifs-utils` installs `cifs-utils` to mount the code folder.

   If all dependencies are included into the docker image, it can save time to download and install them during each running. But if dependencies are updated frequently, or various for different job types, they can be installed during job running.

2. **Prepare files**. `mkdir /models && mount -t cifs //<AddressOfSharedServer>/<SharedFolder> /models -o username=<UserName>,password=<Password> && cd /models/research/slim`, mounts a shared folder, which contains the code. If other folders contain data or model, they can be mounted as this place also.

3. **Run core logic**. The commands, `python3 download_and_convert_data.py --dataset_name=cifar10 --dataset_dir=/tmp/data && python3 train_image_classifier.py --dataset_name=cifar10 --dataset_dir=/tmp/data --train_dir=/tmp/output --max_number_of_steps=1000`, are the same as in [the hello-world example](training.md#submit-a-hello-world-job).

4. **Save outputs**. The docker container will be destroyed once job completed. So, if any result file is needed, it should be saved out of the docker container. The command, `cp -rf /tmp/output /models/output`, copies the trained model and checkpoints back to the shared folder.

Note, this example put all steps in the command field. Some steps can be in a bash or python script, and use a command starts it, so that the script can handle more complex logic.

## Approaches

Besides sharing, files can be built into the docker image directly or copied in/out. The three approaches have different fitness. Below introduce their advantages, shortcomings, and how-to.

### Sharing

It maintains a connection between storage and docker container, and usual keeps alive during the whole lifecycle of job.

- Advantage
  - It doesn't transfer data until needed. So, it can share a large size folder without extra performance impact.
  - It's easy to use. A mounted folder supports the same code logic as a local folder.
  - The write operations happen on shared files immediately. So that it can reflect changes quickly.

- Shortcoming
  - If network is unstable during job running, the job may be failed, as the shared file may be accessed any time.
  - If files are read/write multiple times, they may spend multiple times of network IO than other approaches.
  - Most sharing protocols cannot pass through firewall.
  - Most sharing protocols are significant low performance when accessing many small files.
  - The disk or network IO may be bottleneck if the shared folder is accessed by many jobs.
  - It may cause corrupt files if multiple jobs save back on a file at the same time.

- Applicable scenarios
  - The sharing storage and OpenPAI are in same intranet, and the IOPS of storage is enough to handle concurrent jobs.
  - The folder contains files, which won't be accessed during job running.
  - There are not many small files, and no needed to save files concurrently.

- How-to use

  The [general practice](#general-practice) uses sharing and it's a good demonstration of SMB protocol. [NFS](https://en.wikipedia.org/wiki/Network_File_System) is also a popular sharing protocol. `apt install nfs-common && mkdir /models && mount -t nfs4 <server address>:<server path> /models` can be used to install and mount NFS folder.

  Refer to [here](https://www.linux.org/docs/man8/mount.html) for more information about `mount` command and other types of sharing protocol.

### Copy

It only creates a connection when transferring files, and caches files locally.

- Advantage
  - The disk IO performance is much higher than shared remote files, as files are copied to local. If some files need to be read/written multiple times, it's also much quickly.
  - Some transferring protocols can pass firewall. Many mature protocols can transfer files, including SSH, SFTP, HTTP, SMB and so on.
  - If network is unstable, copy has higher chance to get jobs succeed, as it doesn't need to keep a connection long time.

- Shortcoming
  - It needs logic to copy files selectively if partial files are needed.
  - There may not have a chance to copy outputs out if the job is failed unexpectedly.
  - There may not have enough disk space to copy all files to local.
  - Most protocols are significant low performance when accessing many small files.

- Applicable scenarios
  - The disk size of docker container is enough to copied files.
  - Copied files need high IO performance, or accessed multiple times.
  - There are not many small files.

- How-to use

  Copy is a general approach, not a specified tool or protocol. So, all commands that can transfer files can be called as a copy approach. It includes SSH, SFTP, FTP, HTTP, SMB, NFS and so on.

  Below is an example of the command field, it uses `smbclient` and has the same functionality as the sharing example. `smbclient` also uses the SMB protocol.

  Note, if you'd like to have a try, the prerequisites are the same as the [general practice](#general-practice).

  ```bash
  apt update && apt install -y smbclient && mkdir /models && cd /models && smbclient --user=<UserName> //<AddressOfSharedServer>/<SharedFolder> <Password> -c "prompt OFF;recurse ON;mask *.py;mget *" -m=SMB2 && cd /models/research/slim && python3 download_and_convert_data.py --dataset_name=cifar10 --dataset_dir=/tmp/data && python3 train_image_classifier.py --dataset_name=cifar10 --dataset_dir=/tmp/data --train_dir=/tmp/output --max_number_of_steps=1000 && smbclient --user=<UserName> //<AddressOfSharedServer>/<SharedFolder> <Password> -c "prompt OFF;cd /output;lcd /tmp/output;recurse ON;mput *" -m=SMB2
  ```

  For more information about other protocols and tools, refer to corresponding documents.

### Docker Built-in

- Advantage
  - It saves time and IO to copy files for each running, as docker images are cached locally.
  - It has good IO performance like copy as all files are at local.
  - It can handle many small files, as files are in the docker image blob.

- Shortcoming
  - It needs sharing or copy approach if output files need to be persistent.
  - It needs to rebuild docker image if files are updated. And cache of all docker images are expired also and needs to be downloaded again.
  - It's not suitable, if file size is large. In general, the docker image is about 2~4 GB. So, if files are more than 1GB, it's not suitable built into docker image.

- Applicable scenarios
  - The files are not changed frequently, and the size is no more than 1GB.
  - The files are many small files.

- How-to use

  Below is an example more like hello-world since it doesn't copy outputs out.

  1. Refer to [here](https://docs.docker.com/docker-hub/) for building a docker image and pushing to hub.docker.com. Below docker file clones code into the docker image.

  ```docker
  FROM tensorflow/tensorflow:1.12.0-gpu-py3

  RUN apt update && apt install -y git && cd / && git clone https://github.com/tensorflow/models
  ```

  2. Change the job config like below. Besides the command field, the image field is also different. The image field needs the location of the docker image, which contains code.

  ```json
  {
    "jobName": "tensorflow-cifar10",
    "image": "<your image name>",
    "taskRoles": [
    {
      "name": "default",
      "taskNumber": 1,
      "cpuNumber": 4,
      "memoryMB": 8192,
      "gpuNumber": 1,
      "command": "cd /models/research/slim && python download_and_convert_data.py --dataset_name=cifar10 --dataset_dir=/tmp/data && python train_image_classifier.py --dataset_name=cifar10 --dataset_dir=/tmp/data --max_number_of_steps=1000"
    }
    ]
  }
  ```

## In cloud (Azure)

If OpenPAI is deployed in Azure, [Azure Files](https://azure.microsoft.com/en-us/services/storage/files/) and [Blob Storage](https://azure.microsoft.com/en-us/services/storage/blobs/) uses to store files.

Azure Files offers fully managed file shares in the cloud that are accessible via the industry standard SMB protocol. It supports to [share by mount](https://docs.microsoft.com/en-us/azure/storage/files/storage-how-to-use-files-linux) command or copy files by [Python SDK](https://docs.microsoft.com/en-us/azure/storage/files/storage-python-how-to-use-file-storage). A GUI tool, [Storage Explorer](https://docs.microsoft.com/en-us/azure/vs-azure-tools-storage-explorer-files), can manage files on Windows, Linux and macOS.

Azure Blob storage is Microsoft's object storage solution for the cloud. Blob storage is optimized for storing massive amounts of unstructured data. It supports [a lot of approaches](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-blobs-introduction#move-data-to-blob-storage) to access files, for example, [AzCopy](https://docs.microsoft.com/en-us/azure/storage/common/storage-use-azcopy-v10) to copy data, [blobfuse](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-how-to-mount-container-linux) to mount for sharing. It also supports [Python SDK](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-quickstart-blobs-python) and [Storage Explorer](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-quickstart-blobs-storage-explorer) as Azure Files.

## Many small files

In some deep learning jobs, training data is a lot of small files, like image, audio or text. Its IO performance is low if those files are not at local already. One of practice is to pack them into one file, and then transfer it to local. There is extra cost on unpacking, but it's faster than transferring them in most cases.

## Large file size

If need files is in terabytes, it needs to avoid exhausting local disk space. It's a common challenge, and OpenPAI has the same also. A better hardware infrastructure or algorithm is needed to mitigate the challenge.

## HDFS in OpenPAI

OpenPAI deploys a HDFS service to save logs and other files. This HDFS can be used to store files, BUT it's **NOT** recommended to use. As the storage doesn't guarantee quality, due to servers may leave/join OpenPAI cluster frequently, and disk space may not be enough.

For some very small clusters, if administrators are users also, they may use the HDFS to simplify deployment. But above risks should be in mind.
