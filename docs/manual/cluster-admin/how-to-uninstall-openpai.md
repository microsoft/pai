# How to Uninstall OpenPAI

## <div id="gte100-uninstallation">Uninstallation Guide for OpenPAI >= v1.0.0</div>

The uninstallation of OpenPAI >= `v1.0.0` is irreversible: all the data will be removed and you cannot find them back. If you need a backup, do it before the uninstallation.

First, log in to the dev box machine and delete all PAI services with [dev box container](./basic-management-operations.md#pai-service-management-and-paictl).:

```bash
sudo docker exec -it dev-box /pai/paictl.py service delete
```

Now all PAI services and data are deleted. If you want to destroy the Kubernetes cluster too, please go into [`~/pai-deploy/kubespray` folder](installation-guide.md#keep-a-folder), run:

```bash
ansible-playbook -i inventory/pai/hosts.yml reset.yml --become --become-user=root -e "@inventory/pai/openpai.yml"
```

We recommend you keep the folder `~/pai-deploy` for re-installation.

## <div id="lt100-uninstallation">Uninstallation Guide for OpenPAI < v1.0.0<div>

### Save your Data to a Different Place

During the uninstallation of OpenPAI < `v1.0.0`, you cannot preserve any useful data: all jobs, user information, the dataset will be lost inevitably and irreversibly. Thus, if you have any useful data in the previous deployment, please make sure you have saved them to a different place.

#### HDFS Data

Before `v1.0.0`, PAI will deploy an HDFS server for you. After `v1.0.0`, the HDFS server won't be deployed and previous data will be removed in the upgrade. The following commands could be used to transfer your HDFS data:

``` bash
# check data structure
hdfs dfs -ls hdfs://<hdfs-namenode-ip>:<hdfs-namenode-port>/

hdfs dfs -copyToLocal hdfs://<hdfs-namenode-ip>:<hdfs-namenode-port>/ <local-folder>
```

`<hdfs-namenode-ip>` and `<hdfs-namenode-port>` are the IP of PAI master and `9000` if you didn't modify the default setting. Please make sure your local folder has enough capacity to hold the data you want to save.

#### Metadata of Jobs and Users

Metadata of jobs and users will also be lost, including job records, job log, user name, user password, etc. We do not have an automatic tool for you to backup these data. Please transfer the data manually if you find some are valuable.

#### Other Resources on Kubernetes

If you have deployed any other resources on Kubernetes, please make a proper backup for them, because the Kubernetes cluster will be destroyed, too.

### Remove Previous PAI deployment

To remove the previous deployment, please use the commands below:

``` bash
git clone https://github.com/Microsoft/pai.git
cd pai
#  checkout to a different branch if you have a different version
git checkout pai-0.14.y

# delete all PAI service and remove all service data
./paictl.py service delete

# delete k8s cluster
./paictl.py cluster k8s-clean -f -p <path-to-your-old-config>
```

If you cannot find the old config, the following command can help you to retrieve it:

``` bash
./paictl.py config pull -o <path-to-your-old-config>
```

You should also remove the GPU driver installed by OpenPAI, by executing the following commands on every GPU node, using a `root` user:

``` bash
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
        echo "The driver NVIDIA is still in use, can't unload it."
        exit 1
    }
}

rm -rf /var/drivers
reboot
```
