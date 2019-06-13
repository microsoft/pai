# Upgrade to v0.13

We have test the upgrade process against v0.8 and later. It takes hours or more, depends on the number of nodes in the cluster and the internet network speed. During the upgrade, running jobs will fail. And jobs will automatically retry after the upgrade have done.

Table of Contents

1. [Prepare](#Prepare)
2. [Stop Services and Backup Data](#Stop-Services-and-Backup-Data)
3. [Destroy Kubernetes Cluster](#Destroy-Kubernetes-Cluster)
4. [Install Kubernetes Cluster](#Install-Kubernetes-Cluster)
5. [Run Migration Scripts And Start Services](#Run-Migration-Scripts-And-Start-Services)
6. [It's Done](#It's-Done)

## Prepare

### Setup a dev-box

All the commands in the document excuted in dev-box. You will need to prepare a dev-box first. Run the fellow command to create one and work in it:

```bash
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
        docker.io/openpai/dev-box:v0.13.0

# Working in your dev-box
sudo docker exec -it dev-box /bin/bash
cd /pai

# setup kubernetes environments
./paictl.py cluster k8s-set-env
# then input master node ip
```

### Check PAI cluster version

You could check version from the cluster configuration file `service-configuration.yaml`.

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

### Backup PAI cluster configuration

If you cluster is v0.9 and later, you could fetch the config from the cluster via paictl:

`./paictl.py config pull -o path_to_backup_your_config`

There should be four files under the `path_to_backup_your_config`:

1. `layout.yaml` (or `cluster-configuration.yaml` in version 0.8/0.9)
2. `k8s-role-definition.yaml`
3. `kubernetes-configuration.yaml`
4. `services-configuration.yaml`

### Convert and customize cluster configuration

PAI provide a script tools to convert configuration from old style.

Usage:

`./deployment/tools/configMigration.py path_to_backup_your_config path_to_output_new_style_config`

Then you could customize the generate config under the directory `path_to_output_new_style_config` per need.

If you are using webportal plug-in before v0.11 (confirmed that if `webportal.plugins` in `services-configuration.yaml`), you need to run an extra script after above command: `./deployment/tools/pluginIdMigration.py path_to_output_new_style_config path_to_output_new_style_config`

### Validate Cluster Configuration

PAI provide an `check` command for validating configuration, usage as below:

`./paictl.py check -p path_to_output_new_style_config`

## Stop Services and Backup Data

### Push The Converted Configuration To Cluster

Notices: the configuration pushed to cluster won't take effect until we restart the PAI Services. Use the command like below:

`./paictl.py config push -p path_to_output_new_style_config`

### Stop PAI Services

We stop all PAI Services:

`./paictl.py service stop`

Now the PAI is down, won't be able to access the PAI dashboard.

### Backup Data

Data won't lost during the upgrade, the backup is optional but recommended.

Now please login onto the master node, and backup the data for ETCD, Zookeeper and etc. Below is a list of directories should take care (please backup them):

1. PAI common data path, check the `service-configuration.yaml`, there is a config `cluster.common.data-path`. Please don't change it unless you know excatly what you are doing.
2. Etcd data path, check the `kubernetes-configuration.yaml`, there is a config `kubernetes.ectd-data-path`.

## Destroy Kubernetes Cluster

We will reinstall it with new configuration, destroy it first:

`./paictl.py cluster k8s-clean -p path_to_output_new_style_config`

Now the Kubernetes cluster is down.

## Install Kubernetes Cluster

Install the Kubernetes cluster:

`./paictl.py cluster k8s-bootup -p path_to_output_new_style_config`

Now the Kubernetes cluster is up, you can check the Kubernetes dashboard.

## Run Migration Scripts And Start Services

During the Service starting up, migrate script will be automatically called:

`./paictl.py service start`

Now the PAI is up, you can visit the PAI dashboard.

## It's Done

Now you have PAI upgraded, please check the release-notes for new features.