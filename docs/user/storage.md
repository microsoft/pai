# How to use storage

- [How to use storage](#how-to-use-storage)
  - [Why care about storage](#why-care-about-storage)
  - [Practice](#practice)
    - [General practice](#general-practice)
    - [Approaches](#approaches)
      - [Sharing](#sharing)
      - [Copy](#copy)
      - [Docker Built-in](#docker-built-in)
  - [Considerations](#considerations)
    - [Performance](#performance)
    - [Firewall](#firewall)
    - [Large number of files](#large-number-of-files)
    - [tricks](#tricks)

## Why care about storage

The OpenPAI manages computing resources, but it doesn't provide persistent storage for data, code, or model files. And as a cluster, OpenPAI schedules training jobs on a docker container, which is a fresh environment, there may not have all needed data, code, or model. So, a job of OpenPAI should prepare files first, and after core part finished, may save files back to storage. Files are usual stored in a remote place, not in the fresh environment.

When using remote files, besides file size, the IO performance should be considered also. It will be discussed in later sections.

## Practice

### General practice

Below is an job configuration, which bases on [the hello-world example](training.md#submit-a-hello-world-job). The only difference is the command field. It uses storage instead of cloning code from GitHub, and saves back trained outputs.

Note, this configuration mounts a windows shared folder into docker container. If you'd like to have a try, All statements are surrounded by `<>` should be replaced to actual value, and it needs to clone [corresponding code](https://github.com/tensorflow/models) into the shared folder. Statements include server name, shared folder name, user name and password.

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
    "command": "apt update && apt install -y cifs-utils && mkdir /models && mount -t cifs //<AddressOfSharedServer>/<SharedFolder> /models -o username=<UserName>,password=<Password> && cd /models/research/slim && python3 download_and_convert_data.py --dataset_name=cifar10 --dataset_dir=/tmp/data && python3 train_image_classifier.py --dataset_name=cifar10 --dataset_dir=/tmp/data --train_dir=/tmp/output --max_number_of_steps=1000 && cp -rf /tmp/output /models/output"
    }
]
}
```

The example demonstrated below general steps to run a job in the command field.

1. **Prepare environment**. The docker container is used to prepare most dependencies of the environment. But if it needs other components like `apt update && apt install -y cifs-utils` above, they can be installed by apt, pip or else. It recommends to include all needed dependencies in docker image, and it would save time to download them when running job. But it's also cost to update docker image frequently. So, it can be balanced about when to install a dependency.
2. **Prepare files**. If files may be different each running, or it's too big or too many. They are not appropriate to build into docker image. In this example, the command, `mkdir /models && mount -t cifs //<AddressOfSharedServer>/<SharedFolder> /models -o username=<UserName>,password=<Password>`, mounts a shared folder, which contains the code. So, the code doesn't need to be cloned from GitHub.
3. **Run core logic**. The commands, `cd /models/research/slim && python3 download_and_convert_data.py --dataset_name=cifar10 --dataset_dir=/tmp/data && python3 train_image_classifier.py --dataset_name=cifar10 --dataset_dir=/tmp/data --train_dir=/tmp/output --max_number_of_steps=1000` is almost the same as [the hello-world example](training.md#submit-a-hello-world-job). So, this example is and the hello-world example has the same core training logic also.
4. **Save output**. The docker container will be destroyed, once job completed. So, if any file is necessary, it should be saved out of the docker container. The command, `cp -rf /tmp/output /models/output`, copies the trained model and checkpoints back to the shared folder.

Note, this example put all steps in commands field, and they can be in a bash or python script also. The command can start the script.

### Approaches

Besides sharing, the files can be accessed in docker container by copying, or building into the docker image directly. The three approaches have different fitness. Below introduces how to choose one of approaches, and their advantages and shortcomings.

#### Sharing

It builds a connection between storage and docker container, and the connection usual keeps alive during the whole job lifecycle.

- **Advantage**
  - It doesn't transfer data, until the data is accessed. So, it's ok to sharing a folder with large size of files. Only used files will be transferred to docker containers.
  - If a remote folder is mounted into docker container, it looks like a local folder. So the code logic is the same as accessing local files.
  - The read/write operations happen on remote files immediately. So that it can reflect changes in the shared folder quickly.

- **Shortcoming**
  - As the sharing connection keeps alive long time. So, if network is unstable during job running, the job may be failed.
  - If some files are read multiple times, they may spend more network IO than other approaches.
  - Most sharing protocols is not easy to pass through firewall. So it's hard to use sharing crossing network boundaries.
  - Most sharing protocols are low performance with many small files. If data is plenty of small files, it may significant slow down the job.
  - If sharing storage is centralized, and there are many jobs accesses files, network or disk IO of the central storage may be the bottleneck.
  - It may cause corrupt files, if multiple jobs save back on same files.

- **Applicable scenarios**
  - The sharing storage and OpenPAI are in same intranet, and the IOPS of storage is good to handle concurrency.
  - If shared folder contains a lot of files, but many of them won't be accessed during job running. Sharing can save traffic of these files.
  - There is no much small files, and no needed to save or load files multiple times.

- **How-to use**

  Above example uses CIFS, which can access shared folder of Windows. If a storage is Linux, it can use NFS or CIFS. The sharing part of command field can be replaced like `apt install nfs-common && mkdir /models && mount -t nfs4 <server address>:<server path> /models`, if it's using NFS.

  Refer to [here](https://www.linux.org/docs/man8/mount.html) for more information about `mount` command.

#### Copy

Copy builds a connection when it needs to transfer files. Once copy completes, the connection can be closed.

- **Advantage**
  - It doesn't need to keep a connection long time. If network is unstable, copy has higher chance to get needed files.
  - After copied, files are accessed locally, so the IO performance is much better than remotely. If some files need to be written multiple times, it's also much quickly.
  - There are many mature protocols to copy files, including SSH, SFTP, HTTP, SMB and so on. Some of them can pass firewall easily.

- **Shortcoming**
  - If only part of files are needed in a folder, copy may need some logic to choose copied files to save network IO and docker disk space.
  - If the job is failed with unexpected reason, there may not have a chance to copy any content out.
  - As the storage limitation of the docker container, if needed files is large size, it's not suitable to copy all of them to the docker container.
  - Most copy protocols are low performance with may small files. If data is plenty of small files, it may significant slow down the copy procedure.

- **Applicable scenarios**
  - If copied files are not in large size, which causes the size of docker container isn't enough.
  - If copied files need high IO performance, and accessed multiple times.
  - There is no much small files.

- **How-to use**

  Copy is an general approach, not a specified tool. So all commands that can copy files can be called as a copy approach. It includes SSH, SFTP, FTP, HTTP, SMB, NFS and so on.

  This is an example of command field, it uses `smbclient` and has the same functionality as the sharing example. It copies all files to docker container, run the training procedure, and then copy output back to shared folder.

  ```bash
  apt update && apt install -y smbclient && mkdir /models && cd /models && smbclient --user=<UserName> //<AddressOfSharedServer>/<SharedFolder> <Password> -c "prompt OFF;recurse ON;mask *.py;mget *" -m=SMB2 && cd /models/research/slim && python3 download_and_convert_data.py --dataset_name=cifar10 --dataset_dir=/tmp/data && python3 train_image_classifier.py --dataset_name=cifar10 --dataset_dir=/tmp/data --train_dir=/tmp/output --max_number_of_steps=1000 && smbclient --user=<UserName> //<AddressOfSharedServer>/<SharedFolder> <Password> -c "prompt OFF;cd /output;lcd /tmp/output;recurse ON;mput *" -m=SMB2
  ```

  For more information about other tools, refer to corresponding manual.

#### Docker Built-in

- **Advantage**
  - As docker images are cached locally, so it saves time to copy files for each running. It isn't like sharing and copy.
  - As all files are packed in docker images, it has good IO performance, when there are many small files.
  - As it saves time on file transferring, once docker image is cached, the job runs faster than other approaches.

- **Shortcoming**
  - If any file should be copied out from the docker container, it needs sharing or copy approach.
  - Every time the files are updated, the docker needs to be built again. All docker caches are expired also, and need to be downloaded again.
  - It's not suitable for large size files. In general, the docker image is about 2~4 GB. So, if files is more than 1GB, it's not suitable built into docker image.

- **Applicable scenarios**
  - The files are not changed frequently, and size is no more than 1GB.
  - The files are many small files.

- **How-to use**

  Below is an example like hello-world, but it uses `smbclient` to copy output out from the docker images.

  1. Refer to [here](https://docs.docker.com/docker-hub/) for more details about building a docker image, and push it to hub.docker.com.

     ```docker
     FROM tensorflow/tensorflow:1.12.0-gpu-py3

     RUN apt update && apt install -y git && cd / && git clone https://github.com/tensorflow/models
     ```

  2. Change the job config like below.

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

     Note, this example isn't like sharing and copy approaches, as it doesn't transfer output files out.

## Considerations

### Performance

file

- Mount

means to mount a remote folder
big data, save copy time.

- Copy

shorter time, stable, faster
Built into Docker image

### Firewall

### Large number of files
### tricks

many files copy performance, zip

HDFS not to use

accessible
