# 使用 Docker 建立工作环境

本系统在一个或多个 Docker 容器内执行深度学习任务。需要预先准备一个 Docker 镜像，系统内置一个支持HDFS，CUDA和cuDDN的基础Docker镜像，用户可以以此为基础进行定制。

如何构建 Docker 镜像, 参见： [Dockerfile.build.base](../../examples/Dockerfiles/cuda8.0-cudnn6/Dockerfile.build.base), 执行:

```sh
docker build -f Dockerfiles/Dockerfile.build.base -t pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04 Dockerfiles/
```

在 Dockerfile 里添加 `FROM pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04` 完成镜像构建。


如自定义 TensorFlow Docker 镜像 ，参见： [Dockerfile.run.tensorflow](../../examples/Dockerfiles/cuda8.0-cudnn6/Dockerfile.run.tensorflow):

```sh
docker build -f Dockerfiles/Dockerfile.run.tensorflow -t pai.run.tensorflow Dockerfiles/
```
接下来，将构建好的镜像推送到 docker 仓库，以便被系统内其他节点访问。

```sh
docker tag pai.run.tensorflow your_docker_registry/pai.run.tensorflow
docker push your_docker_registry/pai.run.tensorflow
```
结束后，镜像就可以被访问了。需要注意的是，上面脚本中 docker 仓库是在本地部署，实际的脚本内容依赖于本地仓库的具体配置。

## 镜像启用 SSH

在OpenAI里，Docker 镜像如果没有 *openssh-server* 和 *curl* 模块，SSH 服务将无法启动。如果想启用 SSH，参见如下步骤：

首先，创建 "example.Dockerfile" 文件，添加下面的命令. 这里我们使用 "ufoym/deepo:pytorch-py36-cu90" 作为例子。在实际环境中替换成真实的镜像名称。

```bash
# replace "ufoym/deepo:pytorch-py36-cu90" with your own docker images
FROM ufoym/deepo:pytorch-py36-cu90
RUN apt-get update
RUN apt-get -y install openssh-server curl
```

然后，登录到 Docker Hub (如果没有账号，访问 https://hub.docker.com/signup 注册)。

```bash
# follow the instructions to login
docker login
```

最后，使用下面的命令构建镜像，并推送到Docker HUB。


```bash
 docker build -f example.Dockerfile -t <Your Docker ID>/pytorch-py36-cu90-ssh .
 docker push <Your Docker ID>/pytorch-py36-cu90-ssh
```
现在你可以在 OpenPAI 里使用 "\<Your Docker ID\>/pytorch-py36-cu90-ssh"了，这个镜像支持SSH.
