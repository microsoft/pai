# How to use storage

- [How to use storage](#how-to-use-storage)
  - [Why care about storage](#why-care-about-storage)
  - [Practice](#practice)
    - [General practice](#general-practice)
    - [Approaches](#approaches)
      - [Sharing](#sharing)
      - [Copy](#copy)
      - [Docker Built-in](#docker-built-in)
  - [Other considerations](#other-considerations)
    - [Performance](#performance)
    - [Sharing](#sharing-1)
    - [Firewall](#firewall)
  - [How to copy](#how-to-copy)
  - [Others](#others)
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

Besides sharing, the files can be accessed in docker container by copying, or building into the docker image directly. The three approaches have different fitness. Below introduces how to choose one of approaches, and their strengths and weaknesses.

#### Sharing

- Strength.Sharing builds a connection between storage and docker container, the connection keeps alive until files are not needed. It doesn't transfer data, until it's really needed. If a remote folder is mounted into docker container, it can be regards as a local folder. All read/write happens immediately. So that it can reflect changes in the shared folder quickly.

- Weakness.
  - As the sharing connection keeps alive long time. So, if network is unstable during job running, the job may be failed.
  - If some files are read multiple times, they may be loaded multiple times.
  - Most sharing protocols is not easy to pass through firewall.
  - Most approaches are low performance with many small files. If data is plenty of small files, it may significant slow down the job.
  - If sharing storage is centralized, concurrent may impact the whole job life cycle. And there may be conflicts on saving data back.

- Suggested scenarios. Sharing is a good approach, if some of below conditions are met,
  - The sharing storage and OpenPAI are in same intranet, and the IOPS of storage is good to handle concurrency.
  - If shared folder contains a lot of files, but many of them won't be accessed during job running. Sharing can save traffic of these files.
  - There is no much small files, and no needed to save or load files multiple times.

- How-to. Above example uses CIFS, which can access shared folder of Windows.

  If the storage installs Linux, it can use NFS also. The sharing part can be replaced like `apt update && apt install nfs-common && mkdir /models && mount -t nfs4 <server address>:<server path> /models`.

  Refer to [here](https://www.linux.org/docs/man8/mount.html) for manual of mount.

#### Copy

- Strength.

- Weakness.

- Suggested scenarios.

- How-to.

#### Docker Built-in

- Strength.

- Weakness.

- Suggested scenarios.

- How-to.

## Other considerations


### Performance

file

- Mount

means to mount a remote folder
big data, save copy time.

- Copy

shorter time, stable, faster
Built into Docker image

### Sharing

### Firewall

## How to copy

## Others

### tricks

many files copy performance, zip

HDFS not to use

accessible
