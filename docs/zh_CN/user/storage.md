# 如何使用存储

- [如何使用存储](#how-to-use-storage) 
  - [为什么要关注存储](#why-care-about-storage)
  - [一般方法](#general-practice)
  - [主要方法](#approaches) 
    - [共享路径](#sharing)
    - [复制](#copy)
    - [Docker 内置](#docker-built-in)
  - [云服务存储（Azure）](#in-cloud-azure)
  - [大量小文件](#many-small-files)
  - [大数据量](#large-file-size)
  - [OpenPAI 中的 HDFS](#hdfs-in-openpai)

## 为什么要关注存储

OpenPAI 会管理计算资源，但不提供数据、代码或模型文件的持久化存储。 OpenPAI 上的训练 Job 运行在 Docker 容器中，这些容器每次都会重建，运行完成即被删除。 因此， OpenPAI Job 需要先准备好文件，并在环境被删除前将输出的文件保存出来。

本文介绍了如何在 OpenPAI 中访问文件。实际上，这与在一般的 Docker 容器中访问文件是一样的。

## 一般方法

下面的 Job 配置与 [hello-world 示例](training.md#submit-a-hello-world-job)非常类似，只有 command 字段有些不同。 command 字段用了共享文件夹中的代码，而不是从 GitHub 克隆代码，另外还将输出保存回了这个文件夹。

注意，本例使用了 Windows 共享文件夹。Linux下，可使用 [Samba](https://www.samba.org/) 来创建共享文件夹。 如果要尝试此示例，需要：

    1. 克隆 [相应的代码](https://github.com/tensorflow/models) 并共享该文件夹。
    2. 填写所有变量，包括：`<AddressOfSharedServer>`, `<SharedFolder>`, `<Username>`, 以及 `<Password>`。
    

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

command 字段可分为以下几步。

1. **准备环境**。 Docker 镜像已经准备好了大部分依赖。 但如果 Job 需要更多的组件，可通过 apt，pip 或其它命令来安装。 此例中，`apt update && apt install -y cifs-utils` 安装了 `cifs-utils` 来挂载代码文件夹。
  
  如果将所有依赖都包含在 Docker 映像中，可以在每次运行前省下下载和安装时间。 但如果这些依赖更新得非常频繁，或不同的 Job 需要大量的依赖，则可以在 Job 运行时安装。

2. **准备文件**。 `mkdir /models && mount -t cifs //<AddressOfSharedServer>/<SharedFolder> /models -o username=<UserName>,password=<Password> && cd /models/research/slim`，挂在了包含代码的共享文件夹。 如果还有其它文件夹包含了数据或模型，也可以在此挂载上。

3. **执行核心逻辑**。 命令 `python3 download_and_convert_data.py --dataset_name=cifar10 --dataset_dir=/tmp/data && python3 train_image_classifier.py --dataset_name=cifar10 --dataset_dir=/tmp/data --train_dir=/tmp/output --max_number_of_steps=1000` 与 [hello-world 示例](training.md#submit-a-hello-world-job)中的一样。

4. **保存输出**。 Docker 容器会在每次 Job 完成后被删除。 因此，如果需要任何结果文件，要将其保存到 Docker 容器之外。 命令 `cp -rf /tmp/output /models/output` 将训练后的模型和检查点都复制回了共享文件夹。

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
  - If shared folder contains files, which won't be accessed during job running.
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
  - There may not have enough disk space to copy files to local.
  - Most protocols are significant low performance when accessing many small files.

- Applicable scenarios
  
  - The disk size of docker container is enough to copied files.
  - Copied files need high IO performance, or accessed multiple times.
  - There are not many small files.

- How-to use
  
  Copy is a general approach, not a specified tool or protocol. So, all commands that can transfer files can be called as a copy approach. It includes SSH, SFTP, FTP, HTTP, SMB, NFS and so on.
  
  This is an example of the command field, it uses `smbclient` and has the same functionality as the sharing example. It also uses the SMB protocol.
  
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
  - It needs to rebuild docker image if files are updated. All docker caches are expired also and need to be downloaded again.
  - It's not suitable, if file size is large. In general, the docker image is about 2~4 GB. So, if files are more than 1GB, it's not suitable built into docker image.

- Applicable scenarios
  
  - The files are not changed frequently, and the size is no more than 1GB.
  - The files are many small files.

- How-to use
  
  Below is an example more like hello-world since it doesn't copy outputs out.
  
  1. Refer to [here](https://docs.docker.com/docker-hub/) for building a docker image and pushing to hub.docker.com. Below docker file clones code into the docker image.
    
    ```docker FROM tensorflow/tensorflow:1.12.0-gpu-py3
    
    RUN apt update && apt install -y git && cd / && git clone https://github.com/tensorflow/models ```
  
  2. Change the job config like below. Besides the command field, the image field is also different. The image field needs the location of the docker image, which contains code.
    
        json
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

## In cloud (Azure)

If OpenPAI is deployed in Azure, [Azure Files](https://azure.microsoft.com/en-us/services/storage/files/) and [Blob Storage](https://azure.microsoft.com/en-us/services/storage/blobs/) uses to store files.

Azure Files offers fully managed file shares in the cloud that are accessible via the industry standard SMB protocol. It supports to [share by mount](https://docs.microsoft.com/en-us/azure/storage/files/storage-how-to-use-files-linux) command or copy files by [Python SDK](https://docs.microsoft.com/en-us/azure/storage/files/storage-python-how-to-use-file-storage). A GUI tool, [Storage Explorer](https://docs.microsoft.com/en-us/azure/vs-azure-tools-storage-explorer-files), can manage files on Windows, Linux and macOS.

Azure Blob storage is Microsoft's object storage solution for the cloud. Blob storage is optimized for storing massive amounts of unstructured data. It supports [a lot of approaches](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-blobs-introduction#move-data-to-blob-storage) to access files, for example, [AzCopy](https://docs.microsoft.com/en-us/azure/storage/common/storage-use-azcopy-v10) to copy data, [blobfuse](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-how-to-mount-container-linux) to mount for sharing. It also supports [Python SDK](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-quickstart-blobs-python) and [Storage Explorer](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-quickstart-blobs-storage-explorer) as Azure Files.

## Many small files

In some deep learning jobs, training data is a lot of small files, like image, audio or text. Its IO performance is low if those files are not at local already. One of practice is to compress them into one file, and then transfer it to local. There is extra cost on decompressing, but it's shorter than transferring them in most cases.

## Large file size

If need files is in terabytes, it needs to avoid exhausting local disk space. It's a common challenge, and jobs on OpenPAI have the same challenge also. A better hardware infrastructure or algorithm is needed to mitigate the challenge.

## HDFS in OpenPAI

OpenPAI has a HDFS service to save logs and other files. This HDFS can be used to store files, BUT it's **NOT** recommended to use. As the storage doesn't guarantee quality, due to servers may leave/join OpenPAI cluster frequently, and disk space may not be enough.

For some very small clusters, if administrators are users also, they may use the HDFS to simplify deployment. But above risks should be in mind.