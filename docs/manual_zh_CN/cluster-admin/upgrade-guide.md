# Upgrade Guide

This upgrade guide is only for those who have installed OpenPAI >= `v1.0.0`, and want to upgrade current cluster to a newer version. For example, upgrade from `v1.0.0` to `v1.1.0`. If you want to upgrade older version before `v1.0.0` to version >= `v1.0.0`. Please refer to [Installation Guide](./installation-guide.md).

The upgrade process is mainly about modifying `services-configuration.yaml` and using `paictl`. If you are not familiar about them, please first refer to [here](./basic-management-operations.md#pai-service-management-and-paictl) to set up `paictl` and `services-configuration.yaml`.

## Stop All Services and Previous Dev Box Container

First, launch a dev box container of current PAI version, stop all services by:

```bash
./paictl.py service stop
```

The command will ask you for the cluster id for confirmation. If you forget it, another command `./paictl.py config get-id` will help you.

Your current running jobs are not expected to be affected by stopping PAI services.

Use `exit` to leave the dev box container. And remove it by:

```bash
sudo docker stop dev-box
sudo docker rm dev-box
```

## Modify `services-configuration.yaml`

Now, launch a dev box container of new version. For example, if you want to upgrade to `v1.1.0`, you should use docker `openpai/dev-box:v1.1.0`.

Then, retrieve your configuration by:

```bash
./paictl.py config pull -o <config-folder>
```

Find the following section in `<config-folder>/services-configuration.yaml`:

```yaml
cluster:

  # the docker registry to store docker images that contain system services like frameworklauncher, hadoop, etc.
  docker-registry:

    ......

    tag: v1.0.0

    ......
```

Change the `tag` to the version you want to upgrade to, e.g. `v1.1.0`, then save the file.

Push the modifed `services-configuration.yaml` by:

```bash
./paictl.py config push -p <config-folder> -m service
```

## Start All Services

Start all PAI services by:

```bash
./paictl.py service start
```

After all services is started, your OpenPAI cluster is successfully upgraded.