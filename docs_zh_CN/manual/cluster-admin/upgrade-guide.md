# 升级指南

本升级指南仅适用于已安装 OpenPAI >= `v1.0.0` 并希望将当前集群升级到较新版本的用户。例如，从 `v1.0.0` 升级到 `v1.1.0`。如果要将 `v1.0.0` 之前的版本升级到 >= `v1.0.0` 版本，请参考[安装指南](./installation-guide.md)。

升级过程主要是关于修改 `services-configuration.yaml` 和使用 `paictl`。如果您不熟悉它们，请首先参考[这里](./basic-management-operations.md#pai-service-management-and-paictl)来设置 `paictl` 和 `services-configuration.yaml`。

**注意:** 在按照下面步骤升级之前，我们推荐那些从 `v1.6.0` 以下版本 （不包含 `v1.6.0`）升级的人先检查[unmounted database issue](./troubleshooting.md#solve-unmounted-database-problem)。

## 结束所有服务和Dev Box容器

首先，启动当前 PAI 版本的 dev box 容器，通过以下方式停止所有服务：

```bash
./paictl.py service stop
```

该命令将要求提供集群 id 进行确认。如果忘记了它，可用命令 `./paictl.py config get-id` 找回。

如果您不想不想影响到正在运行的任务，可以使用下面的命令，不停止`storage-manager`服务：

```bash
./paictl.py service stop --skip-service-list storage-manager
```

使用 `exit` 离开 dev box 容器。通过以下方式将其删除：

```bash
sudo docker stop dev-box
sudo docker rm dev-box
```

## 修改 `services-configuration.yaml`

现在，启动新版本的 dev box 容器。例如，如果要升级到 `v1.1.0`，则应使用 docker `openpai/dev-box:v1.1.0`。

然后，通过以下方式拉取您的配置：

```bash
./paictl.py config pull -o <config-folder>
```

在 `<config-folder>/services-configuration.yaml` 中找到以下部分：

```yaml
cluster:

  # the docker registry to store docker images that contain system services like frameworklauncher, hadoop, etc.
  docker-registry:

    ......

    tag: v1.0.0

    ......
```

将 `tag` 更改为想要升级到的版本，例如 `v1.1.0`，然后保存文件。

通过以下方式上传修改后的 `services-configuration.yaml`:

```bash
./paictl.py config push -p <config-folder> -m service
```

## 启动所有服务

通过以下方式启动所有的 PAI 服务：

```bash
./paictl.py service start
```

如果您没有停止`storage-manager`，可以使用下面的命令来启动服务：

```bash
./paictl.py service start --skip-service-list storage-manager
```

启动所有服务后，OpenPAI 集群已成功升级。