<!--
  Copyright (c) Microsoft Corporation
  All rights reserved.

  MIT License

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
  documentation files (the "Software"), to deal in the Software without restriction, including without limitation
  the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
  to permit persons to whom the Software is furnished to do so, subject to the following conditions:
  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
  BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
-->

# 部署 Kubernetes （简称 k8s ）
假设集群中的每个节点都有一个静态 IP，系统版本为 Ubuntu 16.04 LTS，将部署以下 k8s 组件并在主机网络下运行。
- kubelet
- apiserver
- controller-manager
- etcd
- scheduler
- dashboard
- kube-proxy

每个 k8s 组件均在 Docker 容器中运行，若系统中没有 Docker，我们的脚本将会自动安装 Docker 最新版本。

## 准备集群配置文件
 [集群配置文件目录](../cluster-configuration/)下为配置示例，并作了详细说明。
配置你自己的集群时，参照该示例，替换你需要更改的参数值即可。

**注意: 请不要更改配置文件目录下的文件名！**

## 高可用 Kubernetes 解决方案
#### 方案一

一些云平台如 Azure 通常提供负载均衡服务，因而若在云平台上部署 PAI，请选择负载均衡服务来实现高可用。

启动 k8s 集群之前，需要对负载均衡进行一些配置。给 master 节点设置后端服务器，并且在 [kubernetes-configuration.yaml](https://github.com/Microsoft/pai/blob/master/cluster-configuration/kubernetes-configuration.yaml) 中设置 `load-balance-ip`：

```yaml

load-balance-ip: load-balance IP

```

#### 方案二
如果你的环境没有负载均衡服务，可以通过给 k8s 集群增加代理节点来实现。PAI 目前只支持单节点
代理。你也可以自行实现高可用的代理。

[The proxy component definition](k8sPaiLibrary/maintainconf/deploy.yaml)

[The conponent templatefile path](k8sPaiLibrary/template)

注意以下 yaml 文件中最后一行的 k8s-role 设置. (非高可用代理)

```yaml
   - hostname: hostname (echo `hostname`)
      hostip: IP
      machine-type: D8SV3
      etcdid: etcdid1
      k8s-role: master
      dashboard: "true"


    - hostname: hostname
      hostip: IP
      machine-type: D8SV3
      etcdid: etcdid2
      k8s-role: master


    - hostname: hostname
      hostip: IP
      machine-type: D8SV3
      etcdid: etcdid3
      k8s-role: master


    - hostname: hostname
      hostip: IP
      machine-type: NC24R
      k8s-role: proxy

```

[kubernetes-configuration.yaml](https://github.com/Microsoft/pai/blob/master/cluster-configuration/kubernetes-configuration.yaml) 中的 `load-balance-ip` 参考如下设置：

```yaml

load-balance-ip: load-balance vip

```

#### 方案三
不使用高可用的 k8s，并且设置一个节点的 `k8s-role` 为 master。例如：

```
    - hostname: hostname (echo `hostname`)
      hostip: IP
      machine-type: D8SV3
      etcdid: etcdid1
      k8s-role: master
      dashboard: "true"


    - hostname: hostname
      hostip: IP
      machine-type: D8SV3
      k8s-role: worker


    - hostname: hostname
      hostip: IP
      machine-type: D8SV3
      k8s-role: worker

```

[kubernetes-configuration.yaml](https://github.com/Microsoft/pai/blob/master/cluster-configuration/kubernetes-configuration.yaml) 中的 `load-balance-ip` 参考如下设置：

```yaml

load-balance-ip: master ip

```


## 集群维护

详情参见 [wiki](https://github.com/Microsoft/pai/wiki/Cluster-Maintenance)

## 准备 dev-box

#### 主机环境
请确保你的 dev-box 对整个集群网络的访问权限。

Python(2.x) 及依赖库安装：
```yaml
sudo apt-get install python python-paramiko python-yaml python-jinja2
sudo pip install python-etcd kubernetes
```
注意：dev-box 上将会安装 kubectl，因而可以通过它访问整个 k8s 集群。

#### 生成 Docker 容器
- 请确保你的 dev-box 对整个集群网络的访问权限。
- 请确保你的 dev-box 已安装 Docker

执行以下命令：
```bash
sudo docker build -t kubernetes-deployment .
sudo docker run -itd \
        -e COLUMNS=$COLUMNS -e LINES=$LINES -e TERM=$TERM \
        -v /path/to/configuration/directory:/cluster-configuration  \
        -v /var/lib/docker:/varl/lib/docker \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -v /hadoop/binary/path:/hadoop/binary/path \
        --pid=host \
        --privileged=true \
        --net=host \
        --name=deployment \
        kubernetes-deployment
sudo docker exec -it deployment /bin/bash
cd /pai/pai-management

```

## 启动

```bash
sudo ./k8sClusterManagement.py -p /path/to/configuration/directory -a deploy
```

## 销毁集群
```bash
sudo ./k8sClusterManagement.py -p /path/to/configuration/directory -a clean
```

## dev-box 中只安装 kubectl
```bash
sudo ./k8sClusterManagement.py -p /path/to/configuration/directory -a install_kubectl
```

## 增加新节点到集群
```bash
sudo ./k8sClusterManagement.py -p /path/to/configuration/directory -f yournodelist.yaml -a add
```

## 删除节点
```bash
sudo ./k8sClusterManagement.py -p /path/to/configuration/directory -f yournodelist.yaml -a remove
```


## 修复 “unhealthy” 状态的worker节点
```bash
sudo ./k8sClusterManagement.py -p /path/to/configuration/directory -f yournodelist.yaml -a repair
```


## 修复崩溃的 etcd 节点 （k8s 重启 etcd 失败）
```bash
sudo ./k8sClusterManagement.py -p /path/to/configuration/directory -f yournodelist.yaml -a etcdfix
```

# 部署 k8s 服务
本节介绍如何使用 k8s 部署系统服务，包括 framework launcher，hadoop，rest server 和 web portal。

## 先决条件

请确保 dev-box 中已安装 Python 和 Docker。

Python(2.x) 及依赖库安装:
```
sudo apt-get install python python-pip python-yaml python-jinja2 
sudo pip install kubernetes
```

[Docker 安装](https://docs.docker.com/engine/installation/linux/docker-ce/ubuntu/)

部署过程依赖于 Docker registry （如  [Docker hub](https://docs.docker.com/docker-hub/)）来存储 Docker 镜像。

## 准备 hadoop 配置（patching）

```
sudo ./prepare_hadoop_config.sh
```
可以根据你的环境自定义 hadoop 配置。

## 集群配置及脚本生成
修改配置文件 [cluster configuration](../cluster-configuration/)，该文件夹下为配置示例，并对配置项做了详细说明。参照该示例，相应配置项替换成你自己所需的参数值即可。

**注意：不要修改[cluster configuration](../cluster-configuration/) 目录下的文件名！**


## 生成 Docker 镜像

```
sudo ./docker_build.py -p /path/to/configuration/directory
```

## 部署 k8s 服务

```
sudo ./deploy.py -d -p /path/to/configuration/directory
```

## 清除已部署的服务

```
sudo ./deploy.py -p /path/to/configuration/directory
sudo ./cleanup-service.py
```

# 高级教程
## 自定义或重新配置 Hadoop 服务

在重新配置之前，请使用 k8s 来停止 Hadoop 服务并删除 Hadoop configmap。
用户可以修改 [Hadoop 配置目录](./bootstrap/hadoop-service/hadoop-configuration/) 下的文件（由 `prepare_hadoop_config.sh` 脚本生成）自定义 Hadoop 配置。

更改配置文件后，执行： 
```
./bootstrap/hadoop-service/start.sh
```

## 添加、删除集群服务
在 [./src/](./src) 下新建一个目录，以你要添加的新服务命名，将所有生成 Docker 镜像所需的文件放置在该目录下，并且在 [service.yaml](service.yaml) 中的 `servicelist ` 添加新服务的描述。

#### 目录结构
```
service-deployment 
|
+-----bootstrap
|       |
|       +------ 以服务名命名的文件夹    （与 service.yaml 中保持一致）
|
+-----src
|       |
|       +------ 以自定义 Docker 容器名命名的文件夹（与 service.yaml 中保持一致）
|
+------deploy.py   （部署服务的脚本）
|
+------docker_build.py (生成所有自定义 Docker 镜像，并推送至 Docker registry）
+------clusterconfig-example.yaml  （集群配置文件）
|
+------service.yaml （集群中所有服务的描述文件及Docker 镜像列表）
|
+------readmd.md
```

#### Service.yaml
将要部署的新服务信息添加至 [service.yaml](service.yaml) ，并且将所需的 Docker 镜像源文件放在指定路径后，即可运行 `deploy.py` 部署服务。

若想移除一些默认的服务，只需在运行 `deploy.py` 之前注释掉 [service.yaml](service.yaml) 里的相关信息即可。


#### 模板
模板引擎采用 [jinja2](http://jinja.pocoo.org/) 。
模板文件中所需的实值信息均从 [clusterconfig-example.yaml](clusterconfig-example.yaml) 获取，若你的服务需要在模板文件中添加更多信息，修改该文件。 新添加的信息应被放置在该文件的 `clusterinfo`、`machineinfo` 或 `machinelist` 字段下。

#### 部署 / 测试单个服务

- ```sudo ./prepare_hadoop_config.sh```
准备 Hadoop 配置。若不确定你的服务是否需要 Hadoop，请不要省略该步骤。


- ```sudo ./docker_build -p /path/to/configuration/directory -n your_image_name```
请确认你的 Docker 镜像正确生成.


- ```sudo ./deploy -p /path/to/configuration/directory -d -s your_service_name```
请确认你的服务正确启动。

- ```sudo ./bootstrap/service/clean.sh```
请确认你的服务能被脚本正确结束，该脚本为你在 [service.yaml](service.yaml) 中指定的脚本。 
