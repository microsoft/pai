# 如何使用存储

- [如何使用存储](#如何使用的存储) 
  - [为什么要关注存储](#为什么要关注存储)
  - [通用流程](#通用流程)
  - [主要方法](#主要方法) 
    - [共享路径](#共享路径)
    - [复制](#复制)
    - [Docker 内置](#docker-内置)
  - [云服务存储（Azure）](#云服务存储（Azure）)
  - [大量小文件](#大量小文件)
  - [大数据量](#大数据量)
  - [OpenPAI 中的 HDFS](#openpai-中的-hdfs)

## 为什么要关注存储

OpenPAI 会管理计算资源，但不提供数据、代码或模型文件的持久化存储。 OpenPAI 上的训练 Job 运行在 Docker 容器中，这些容器每次都会重建，运行完成即被删除。 因此， OpenPAI Job 需要先准备好文件，并在环境被删除前将输出的文件保存出来。

本文介绍了如何在 OpenPAI 中访问文件。实际上，这与在一般的 Docker 容器中访问文件是一样的。

## 通用流程

下面的 Job 配置与 [hello-world 示例](training.md#提交-hello-world-job)非常类似，只有 command 字段有些不同。 command 字段用了共享文件夹中的代码，而不是从 GitHub 克隆代码，另外还将输出保存回了这个文件夹。

注意，此示例使用的是 Windows 的共享文件夹。 [Samba](https://www.samba.org/) 可在 Linux 下支持这样共享文件夹。 如果要尝试此示例，需要：

1. 克隆[相应的代码](https://github.com/tensorflow/models)并共享该文件夹。
2. 替换所有变量为相应的值，包括：`<AddressOfSharedServer>`，`<SharedFolder>`，`<Username>`，以及 `<Password>`。

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

3. **执行核心逻辑**。 命令 `python3 download_and_convert_data.py --dataset_name=cifar10 --dataset_dir=/tmp/data && python3 train_image_classifier.py --dataset_name=cifar10 --dataset_dir=/tmp/data --train_dir=/tmp/output --max_number_of_steps=1000` 与 [hello-world 示例](training.md#提交-hello-world-job)中的一样。

4. **保存输出**。 Docker 容器会在每次 Job 完成后被删除。 因此，如果需要任何结果文件，要将其保存到 Docker 容器之外。 命令 `cp -rf /tmp/output /models/output` 将训练后的模型和检查点都复制回了共享文件夹。

注意，此例将所有步骤都放到了 command 字段中。 有些步骤可以放到 Bash 或 Python 脚本中，然后用一条命令来运行。这样可以用脚本来处理更复杂的逻辑。

## 主要方法

除了共享文件夹，文件也可以直接内置到 Docker 映像中，或复制进出 Docker 容器。 这三种方法适应不同的场景。 以下介绍了它们各自的优缺点以及使用简介。

### 共享路径

这种方法会在存储和 Docker 容器之间建立长时间的连接，一般会在整个 Job 的生命周期都保持可用。

- 优点
  
  - 没有使用的数据不会被传输。 因此，共享很大的目录也不会产生额外的性能影响。
  - 易于使用。 挂载的文件夹和本地文件夹的代码逻辑是一样的。
  - 写操作会立刻发生在共享文件上。 因此可以快速反映改动。

- 缺点
  
  - 因为共享文件可能在任何时候被访问到，所以如果 Job 运行期间网络不稳定，可能会造成 Job 失败。
  - 如果文件被读写多次，与其它方法相比，可能会造成多次网络 IO。
  - 大多数共享路径的协议都不能穿过防火墙。
  - 大多数共享协议在访问大量小文件时，性能都会很低。
  - 如果共享路径被多个 Job 访问，网络或磁盘 IO 可能会成为瓶颈。
  - 如果多个 Job 同时写回同一个文件，可能会造成文件损坏。

- 适用场景
  
  - 共享存储和 OpenPAI 需要在同一个局域网中，存储的 IOPS 需要足够以支持并发的 Job。
  - 文件夹中包含有在 Job 运行过程中不会被访问到的文件。
  - 没有大量小文件，也不需要并发保存文件。

- 如何使用
  
  [通用流程](#通用流程)就使用了共享路径，很好的演示了 SMB 协议的用法。 [NFS](https://en.wikipedia.org/wiki/Network_File_System) 是另一个流行的共享协议。 `apt install nfs-common && mkdir /models && mount -t nfs4 <server address>:<server path> /models` 可用来安装并挂载 NFS 路径。
  
  参考[这里](https://www.linux.org/docs/man8/mount.html)了解更多关于 `mount` 命令以及其它共享协议的信息。

### 复制

此方法仅在传输文件的时候需要连接，将文件缓存在本地。

- 优点
  
  - 因为文件复制到了本地，IO 性能会大大高于远程共享文件。 在多次读写文件的场景下，也非常快。
  - 部分传输协议可穿越防火墙。 许多成熟的协议都可用来传输文件，如 SSH，SFTP，HTTP，SMB 等等。
  - 因为复制不需要长时间保持连接，所以在网络不稳定的情况下，其更有可能让 Job 运行成功。

- 缺点
  
  - 如果只需要部分文件，则需要通过规则来选择复制文件。
  - 如果 Job 意外失败，可能无法将输出复制出来。
  - 可能本地磁盘空间不足以复制所有文件。
  - 大多数协议在访问大量小文件时，性能都会很低。

- 适用场景
  
  - Dockers 容器的磁盘大小足够复制文件。
  - 复制的文件需要很高的 IO 性能，或会被多次访问。
  - 没有大量小文件。

- 如何使用
  
  复制是指的一种方法，而不是某种工具或协议。 能传输文件的命令都可以成为复制的方法。 例如，SSH，SFTP，FTP，HTTP，SMB，NFS 等等。
  
  下面 command 字段的示例使用了 `smbclient`，与共享示例的功能相同。 `smbclient` 也使用了 SMB 协议。
  
  注意，此示例的先决条件与[通用流程](#通用流程)相同。
  
  ```bash
  apt update && apt install -y smbclient && mkdir /models && cd /models && smbclient --user=<UserName> //<AddressOfSharedServer>/<SharedFolder> <Password> -c "prompt OFF;recurse ON;mask *.py;mget *" -m=SMB2 && cd /models/research/slim && python3 download_and_convert_data.py --dataset_name=cifar10 --dataset_dir=/tmp/data && python3 train_image_classifier.py --dataset_name=cifar10 --dataset_dir=/tmp/data --train_dir=/tmp/output --max_number_of_steps=1000 && smbclient --user=<UserName> //<AddressOfSharedServer>/<SharedFolder> <Password> -c "prompt OFF;cd /output;lcd /tmp/output;recurse ON;mput *" -m=SMB2
  ```
  
  更多详情与其它协议和工具，参考其相关文档。

### Docker 内置

- 优点
  
  - 因为 Docker 映像会在本地缓存，所以每次运行都能节省复制文件的时间和 IO 消耗。
  - 与复制方法类似，所有文件都在本地，也会有很好的 IO 性能。
  - 因为文件都在 Docker 映像块文件中，大量小文件也能很好处理。

- 缺点
  
  - 如果输出文件需要被持久化，也需要使用共享或复制的方法。
  - 如果文件有更新，需要重新构建 Docker 映像。 所有 Docker 映像的缓存也会因此而过期，需要重新下载。
  - 如果文件很大，则不适合此方法。 通常，Docker 映像都在 2 到 4 GB 的大小。 因此，如果文件大于 1 GB，就不适合内置到 Docker 映像中。

- 适用场景
  
  - 文件不经常更新，大小不超过 1 GB。
  - 有大量的小文件。

- 如何使用
  
  下面的示例与 hello-world 更类似，没将输出的文件拷贝出来。
  
  1. 参考[这里](https://docs.docker.com/docker-hub/)来构建 Docker 映像并发布到 hub.docker.com 上。 下面的 Docker 文件将代码复制到了 Docker 映像中。
  ```docker
  FROM tensorflow/tensorflow:1.12.0-gpu-py3
  
  RUN apt update && apt install -y git && cd / && git clone https://github.com/tensorflow/models
  ```
  
  2. 参考下列示例来改动 Job 配置。 除了 command 字段，image 字段也不相同。 image 字段需要改为包含有代码的 docker 映像的地址。
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

## 云服务存储（Azure）

如果 OpenPAI 部署在了 Azure中，[Azure Files](https://azure.microsoft.com/en-us/services/storage/files/) 和 [Blob Storage](https://azure.microsoft.com/en-us/services/storage/blobs/) 都可用来保存文件。

Azure Files 提供了完全托管在云中的文件共享方案，可通过标准的 SMB 协议来访问。 它支持通过 [mount](https://docs.microsoft.com/en-us/azure/storage/files/storage-how-to-use-files-linux) 命令来共享，或者通过 [Python SDK](https://docs.microsoft.com/en-us/azure/storage/files/storage-python-how-to-use-file-storage) 来复制文件。 GUI 工具 [Storage Explorer](https://docs.microsoft.com/en-us/azure/vs-azure-tools-storage-explorer-files) 可在 Windows, Linux 和 macOS 下管理文件。

Azure Blob 是微软针对云提供的对象存储方案。 Blob 存储可存储较大的非结构化数据。 它支持[多种方法](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-blobs-introduction#move-data-to-blob-storage)来访问文件，例如使用 [AzCopy](https://docs.microsoft.com/en-us/azure/storage/common/storage-use-azcopy-v10) 来复制数据，[blobfuse](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-how-to-mount-container-linux) 来挂载共享数据。 它和 Azure Files 一样也支持 [Python SDK](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-quickstart-blobs-python) 和 [Storage Explorer](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-quickstart-blobs-storage-explorer)。

## 大量小文件

在一些深度学习 Job 中，训练数据是很多小文件，如图片、音频或文本。 如果这些文件没有存放在本地，那么 IO 性能就会很低。 可将这些小文件文件打包到一个文件中，然后传输到本地。 虽然会有解压的额外成本，但大多数情况下都会比直接传输要快。

## 大数据量

如果文件是 TB 级，则需要避免占满本地磁盘空间。 很多场景下都会有这种挑战，OpenPAI 上也一样。 可采用更好的硬件架构或算法来缓解。

## OpenPAI 中的 HDFS

OpenPAI 部署了一个 HDFS 服务来保存日志和其它文件。 虽然此 HDFS 也可用来存储文件，但**不推荐**这样做。 因为 OpenPAI 集群的服务器可能会频繁增减，磁盘空间也有可能不够，因此无法保证存储的质量。

对于一些非常小的集群，如果管理员就是用户，可以使用此 HDFS 来简化部署。 但同时应考虑上述风险。