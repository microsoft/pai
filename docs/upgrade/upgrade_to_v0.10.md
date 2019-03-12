# Upgrade to v0.10

We have test upgrading from v0.8 and later.

Table of Contents

1. [Prepare](#Prepare)
2. [Stop Services and Backup Data](#Stop-Services-and-Backup-Data)
3. [Destroy Kubernetes Cluster](#Destroy-Kubernetes-Cluster)
4. [Install Kubernetes Cluster](#Install-Kubernetes-Cluster)
5. [Run Migration Scripts And Start Services](#Run-Migration-Scripts-And-Start-Services)
6. [It's Done](#It's-Done)

## Prepare

### Check PAI cluster version

You can check the cluster configuration file `service-configuration.yaml`.

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

Since v0.9, you could fetch the config from the cluster via paictl: `paictl.py config pull -o path_to_backup_your_config`.

There should be four files under the `path_to_backup_your_config`:

1. `cluster-configuration.yaml`(cluster version 0.8) / `layout.yaml`(0.9 and later)
2. `k8s-role-definition.yaml`
3. `kubernetes-configuration.yaml`
4. `services-configuration.yaml`.

### Convert and customize cluster configuration

PAI provide a script tools to convert configuration from old style to the v0.10 release.

Usage:

`./deployment/tools/configMigration.py path_to_backup_your_config path_to_output_new_style_config`.

Then you could customzie the generate config under the directory `path_to_output_new_style_config` per need.

### Validata Cluster Configuration

PAI provide an `check` command for validatng configuration, usage as below:

`./paictl.py check -p path_to_output_new_style_config`

## Stop Services and Backup Data

### Push The Converted v0.10 Configuration To Cluster

Notices: the configuration pushed to cluster won't take effect until we restart the PAI Services.
Use the command like below:

`paictl.py config push -p path_to_output_new_style_config`

### Stop PAI Services

Now we can stop all PAI Services:

`paictl.py service stop`

### Backup Data

Now please login onto the master node, and backup the data for ETCD, Zookeeper and etc.
Below is a list of directories should take care (please backup them):

1. PAI common data path, check the `service-configuration.yaml`, there is a config `cluster.common.data-path`. Please don't change it unless you know excatly what you are doing.
2. Etcd data path, check the `kubernetes-configuration.yaml.yaml`, there is a config `kubernetes.ectd-data-path`.

## Destroy Kubernetes Cluster

We will reinstall it with new configuration, destroy it first:

`./paictl.py cluster k8s-clean -p path_to_output_new_style_config`

## Install Kubernetes Cluster

Install the Kubernetes cluster:

`./paictl.py cluster k8s-bootup -p path_to_output_new_style_config`

## Run Migration Scripts And Start Services

During the Service starting up, migrate script will be automatically called:
`./paictl.py service start`

## It's Done

Now you have the release v0.10 install, please check the release-notes for new features.