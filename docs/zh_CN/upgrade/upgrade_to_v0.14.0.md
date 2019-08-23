# Upgrade to v0.14.0

有关 v0.14.0 的新功能，查看 [发行说明](../../../RELEASE_NOTE.md#july-2019-version-0140) 。升级过程需要数小时，具体取决于集群的节点数量和网络速度。 During the upgrade, running jobs will fail. And jobs will automatically retry after the upgrade have done.

Table of Contents

1. [Prepare](#Prepare)
2. [Backup Data and Deploy k8s Cluster](#Backup-Data-and-Deploy-k8s-Cluster)
3. [Build New Images and Start All Services](#Build-New-Images-and-Start-All-Services)

## Prepare

### Setup a Dev-box

The [dev-box](../pai-management/doc/how-to-setup-dev-box.md) is a docker container which prepares the dependency environment during deployment. All the commands in this doc are excuted in the dev-box. Hence firstly you need to build dev-box of 0.14.0 version and start it.

```bash
# build dev-box
git clone https://github.com/Microsoft/pai.git
cd pai
git checkout v0.14.0
cd src/dev-box
sudo docker build -t dev-box . --file=./build/dev-box.dockerfile

# create dev-box
sudo docker run -itd \
        -e COLUMNS=$COLUMNS -e LINES=$LINES -e TERM=$TERM \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -v /pathConfiguration:/cluster-configuration  \
        -v /hadoop-binary:/hadoop-binary  \
        --pid=host \
        --privileged=true \
        --net=host \
        --name=dev-box \
        dev-box

# Working in your dev-box
sudo docker exec -it dev-box /bin/bash
cd /pai

# setup kubernetes environments
./paictl.py cluster k8s-set-env
# then input master node ip
```

Notices: Make sure the python file has execution permission.

### Get PAI Config and Change the Version

If this is the first time you deploy PAI cluster, you should refer the deployment doc to [prepare configuration](../pai-management/doc/distributed-deploy.md#c-step-2)

If you have deployed pai before, and the cluster version is v0.9 or higher, then you could use paictl to pull the config from cluster:

```bash
./paictl.py config pull -o <path_of_config>
```

There should be four files under the `<path_of_config>`:

1. `layout.yaml` (or `cluster-configuration.yaml` in version 0.8/0.9)
2. `k8s-role-definition.yaml`
3. `kubernetes-configuration.yaml`
4. `services-configuration.yaml`

> Whenever you were asked to input the cluster id, you could run ```./paictl.py config get-id``` to get it.

### Change PAI Cluster Version

Check version from the cluster configuration file `service-configuration.yaml`.

It looks like:

```yaml
cluster:
...
  docker-registry:
    namespace: openpai
    domain: docker.io
    tag: v0.8.3 # It's your cluster version
    ...
```

Change the version of tag to ```v0.14.0```

### Convert and Customize Cluster Configuration

To ensure your config is new style, PAI provide a script tools to convert configuration from old style.

Usage:

`./deployment/tools/configMigration.py <path_of_config> <path_of_new_config>`

Then you could customize the generate config under the directory `<path_of_new_config` based on the [configuration doc](../pai-management/doc/how-to-generate-cluster-config.md#Customize).

If you are using webportal plugin before v0.11 (confirmed that if `webportal.plugins` in `services-configuration.yaml`), you need to run an extra script after above command: `./deployment/tools/pluginIdMigration.py <path_of_new_config> <path_of_new_config>`

### Validate Cluster Configuration

PAI provide an `check` command for validating configuration, usage as below:

`./paictl.py check -p <path_of_new_config>`

### Push Updated Configuration to Cluster

Notices: the configuration pushed to cluster won't take effect until we restart the PAI Services. Use the command like below:

`./paictl.py config push -p <path_of_new_config>`

## Backup Data and Deploy k8s Cluster

### Stop PAI Services

If you have a pai cluster with previous version, first stop all PAI services:

`./paictl.py service stop`

Now the PAI is down, won't be able to access the PAI dashboard.

### Backup Data

Data won't lost during the upgrade, the backup is optional but recommended.

Now please login onto the master node, and backup the data for ETCD, Zookeeper and etc. Below is a list of directories should take care (please backup them):

1. PAI common data path, check the `service-configuration.yaml`, there is a config `cluster.common.data-path`. Please don't change it unless you know excatly what you are doing.
2. Etcd data path, check the `kubernetes-configuration.yaml`, there is a config `kubernetes.ectd-data-path`.

### Destroy Kubernetes Cluster

We will reinstall it with new configuration, destroy it first:

`./paictl.py cluster k8s-clean -p <path_of_new_config>`

Now the Kubernetes cluster is down.

### Install Kubernetes Cluster

Install the Kubernetes cluster:

`./paictl.py cluster k8s-bootup -p <path_of_new_config>`

Now the Kubernetes cluster is up, you can check the Kubernetes dashboard.

## Build New Images and Start All Services

### Build Image with New Version

This process is optional. By default all PAI services will use official v0.14.0 images in docker.io. This section works if your cluster has a private docker registry and you want to make some customization based on v0.14.0.

Build and push all the service images with 0.14.0 version. Make sure the pai code is newest. Please refer to [build doc](../pai-build/pai-build.md) for more details.

```bash
./build/pai_build.py build -c <path_of_new_config>
```

If build successfully, push them to the registry. Before you push the docker images, make sure the file `services-configureation.yaml` has correct docker registry info like this:

```yaml
  docker-registry:
    domain: xxx.azurecr.io
    namespace: yyy
    password: zzz
    secret-name: aaa
    tag: 'v0.14.0'
```

```bash
./build/pai_build.py push -c <path_of_new_config>
```

### Start PAI Services

Use paictl to start all services.

```bash
./paictl.py service start
```

Now the PAI is up, you can visit the PAI dashboard.