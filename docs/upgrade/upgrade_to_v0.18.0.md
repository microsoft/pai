# Upgrade to v0.18.0

There are breaking changes between OpenPAI v0.14.0 and v0.18.0. Before v0.18.0, OpenPAI was based on Yarn and Kubernetes, and data was managed by HDFS. Since v0.18.0 ( we might want to change this to v1.0 later after release), OpenPAI has switched to a pure Kubernetes-based architecture. Many new features, such as `AAD authorization`, `Hivedscheduler`, `Kube Runtime`, `Marketplace`, etc., are also included in this release.

The upgrade contains three phases:

  1. Save previous data to a different place.
  2. Remove previous PAI deployment.
  3. Deploy PAI v0.18.0


## Save your Data to a Different Place

The upgrade from older version to `v0.18.0` cannot preserve any useful data: all jobs, user information, dataset will be lost inevitably and irreversibly. Thus, if you have any useful data in previous deployment, please make sure you have saved them to a different place.

#### HDFS Data

Before v0.18.0, PAI will deploy an HDFS server for you. In v0.18.0, the HDFS server won't be deployed and previous data will be removed in upgrade. The following commands could be used to transfer your HDFS data:

```bash
# check data structure
hdfs dfs -ls hdfs://<hdfs-namenode-ip>:<hdfs-namenode-port>/

hdfs dfs -copyToLocal hdfs://<hdfs-namenode-ip>:<hdfs-namenode-port>/ <local-folder>
```

`<hdfs-namenode-ip>` and `<hdfs-namenode-port>` is the ip of PAI master and `9000` if you did't modify the default setting. Please make sure your local folder has enough capacity to hold the data you want to save.

#### Metadata of Jobs and Users

Metadata of jobs and users will also be lost, including job records, job log, user name, user password, etc. We do not have an automatical tool for you to backup these data. Please transfer the data manually if you find some are valuable.

#### Other Resources on Kubernetes

If you have deployed any other resources on Kubernetes, please make a proper backup for them, because the Kubernetes cluster will be destroyed, too.


## Remove Previous PAI deployment

To remove the previous deployment, please use the commands below:

```bash
git clone https://github.com/Microsoft/pai.git
cd pai
#  checkout to a different branch if you have a different version
git checkout pai-0.14.y

# delete all pai service and remove all service data
./paictl.py service delete

# delete k8s cluster
./paictl.py cluster k8s-clean -f -p <path-to-your-old-config>
```

If you cannot find the old config, the following command can help you to retrieve it:

```bash
./paictl.py config pull -o <path-to-your-old-config>
```

You should also remove the GPU driver installed by OpenPAI, by executing the following commands on every GPU node, using a `root` user:

```bash
#!/bin/bash

lsmod | grep -qE "^nvidia" &&
{
    DEP_MODS=`lsmod | tr -s " " | grep -E "^nvidia" | cut -f 4 -d " "`
    for mod in ${DEP_MODS//,/ }
    do
        rmmod $mod ||
        {
            echo "The driver $mod is still in use, can't unload it."
            exit 1
        }
    done
    rmmod nvidia ||
    {
        echo "The driver nvidia is still in use, can't unload it."
        exit 1
    }
}

rm -rf /var/drivers
reboot
```


##  Deploy PAI v0.18.0

Before deployment, you should install NVIDIA driver by yourself for every GPU node.

To determine which version of driver should be installed, check out the [NVIDIA site](https://www.nvidia.com/Download/index.aspx) to verify the newest driver version of your GPU card first. Then, check out [this table](https://docs.nvidia.com/deploy/cuda-compatibility/index.html#binary-compatibility__table-toolkit-driver) to see the CUDA requirement of driver version.

Please note that, some docker images with new CUDA version cannot be used on machine with old driver. As for now, we recommend to install the NVIDIA driver 418 as it supports CUDA 9.0 \~ CUDA 10.1, which is used by most deep learning frameworks.

After you install GPU driver, we recommend to use kubespray to deploy Kubernetes cluster and start PAI service. Please refer to the [doc](../../contrib/kubespray) for help.
