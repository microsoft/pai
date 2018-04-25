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

# Kubernetes Deployment in cluster

We assume each node in the cluster has a statically assigned IP and runs Ubuntu 16.04 LTS.
The following k8s components will be deployed in the designated nodes and run in host network:
- kubelet
- apiserver
- controller-manager
- etcd
- scheduler
- dashboard
- kube-proxy

Each k8s component runs in a Docker container. If Docker is missing in the OS, the script will install the latest Docker version.

## Prepare your cluster configuration

Configure the [cluster configuration](../cluster-configuration/). And the configuration file in this path
illustrate such an example, where some detailed explanation is included.
When deploying services to your cluster, please replace the specified fields with your own configuration.

Note: Don't change the file name!!!!!!!!!!!!

## Kubernetes high-availability

#### solution 1

Because cloud providers such as azure always have the load balance service. So when deploy pai to the cloud platform, you could chose the load-balance service to implement the high-availability.

Before bootstrap your kubernetes cluster, you should configure your load-balance. please set the backend with your master. And set the following property with the ip of the load-balance in the [kubernetes-configuration.yaml](https://github.com/Microsoft/pai/blob/master/cluster-configuration/kubernetes-configuration.yaml).

```yaml

load-balance-ip: load-balance IP

```

#### solution 2

If your environment don't have a load-balance service. You could add proxy node to the kuebrnetes cluster. So you will have to add a node with the k8s-role as proxy. Now we only support single node proxy. If you want to deploy a proxy with ha, you could implement it by yourself.

[The proxy component definition](k8sPaiLibrary/maintainconf/deploy.yaml)

[The conponent templatefile path](k8sPaiLibrary/template)

You should configuration you node role as following. (None-ha proxy)

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


Set the following property with the ip of the load-balance in the [kubernetes-configuration.yaml](https://github.com/Microsoft/pai/blob/master/cluster-configuration/kubernetes-configuration.yaml).

```yaml

load-balance-ip: load-balance vip

```

#### solution 3

Not enable kubernete-ha. And only set one node's k8s-role as master.

For example.
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

Set the following property with the ip of the load-balance in the [kubernetes-configuration.yaml](https://github.com/Microsoft/pai/blob/master/cluster-configuration/kubernetes-configuration.yaml).

```yaml

load-balance-ip: master ip

```


## Cluster maintenance

Please refer to this [wiki](https://github.com/Microsoft/pai/wiki/Cluster-Maintenance)

## Prepare your dev-box environment


#### Host Environment
Make sure your dev box has full network access to the cluster.

Python(2.x) and lib install:
```yaml
sudo apt-get install python python-paramiko python-yaml python-jinja2
sudo pip install python-etcd kubernetes
```

Note: kubectl will be installed on this dev-box. So it can access to your kubernetes cluster.

#### In a docker container
- Make sure your dev box has full network access to the cluster.
- Make sure your dev box has been installed docker.
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



## bootstrap

```bash
sudo ./k8sClusterManagement.py -p /path/to/configuration/directory -a deploy
```

## Destroy your cluster
```bash
sudo ./k8sClusterManagement.py -p /path/to/configuration/directory -a clean
```

## Only install kubectl into your dev-box
```bash
sudo ./k8sClusterManagement.py -p /path/to/configuration/directory -a install_kubectl
```

## Add new nodes to your cluster
```bash
sudo ./k8sClusterManagement.py -p /path/to/configuration/directory -f yournodelist.yaml -a add
```

## Remove nodes from your cluster
```bash
sudo ./k8sClusterManagement.py -p /path/to/configuration/directory -f yournodelist.yaml -a remove
```


## Repair the worker node with the unhealthy states
```bash
sudo ./k8sClusterManagement.py -p /path/to/configuration/directory -f yournodelist.yaml -a repair
```


## Repair the crashed etcd node (kubernetes failed to restart it)
```bash
sudo ./k8sClusterManagement.py -p /path/to/configuration/directory -f yournodelist.yaml -a etcdfix
```






# Deploying Services On Kubernetes

This document explains how to use Kubernetes to deploy system services, including framework launcher, hadoop, rest server, and web portal. 

## Prerequisite

Python and Docker are required in the dev box.

Python(2.x) and the lib to install:
```
sudo apt-get install python python-pip python-yaml python-jinja2 
sudo pip install kubernetes
```

[Docker install](https://docs.docker.com/engine/installation/linux/docker-ce/ubuntu/)

The deployment process further relies on a Docker registry service (e.g., [Docker hub](https://docs.docker.com/docker-hub/)) to store the docker images for the services to be deployed.

## Prepare hadoop configuration (patching)

```
sudo ./prepare_hadoop_config.sh
```

According to your environment, you can customize the hadoop configuration in this step.

## Cluster configuration and script generation

Configure the [cluster configuration](../cluster-configuration/). And the configuration file in this path
illustrate such an example, where some detailed explanation is included.
When deploying services to your cluster, please replace the specified fields with your own configuration.

Note: Don't change the file name!!!!!!!!!!!!


## Build docker image

```
sudo ./docker_build.py -p /path/to/configuration/directory
```

## Deploying services on k8s

Run the following command:
```
sudo ./deploy.py -d -p /path/to/configuration/directory
```

## Cleanup your previous deployment

```
sudo ./deploy.py -p /path/to/configuration/directory
sudo ./cleanup-service.py
```

## For advanced user: Customize or re-config hadoop service

Before reconfiguration, please use k8s to stop hadoop service and remove the hadoop configmap. 
User can customize hadoop configuration in ./bootstrap/hadoop-service/hadoop-configuration/ (configuration files are generated by ./prepare_hadoop_config.sh).
After making the necessary changes to the configuration, please run 
```
./bootstrap/hadoop-service/start.sh
```

## For developer: how to add or remove service to the cluster?

Create a folder with the name of the new service, put all your files of the docker image in the folder, put it in the path ./src/,
and add the detail of the service in the servicelist section in [service.yaml](service.yaml).

#### The folder structure
```
service-deployment 
|
+-----bootstrap
|       |
|       +------ folder with service name    (the name in the service.yaml)
|
+-----src
|       |
|       +------folder with customized image name    (the name in the service.yaml)
|
+------deploy.py   (The script to bootstrap service in the cluster)
|
+------docker_build.py (The script to build all the customized docker image and push them to the docker registry)
|
+------clusterconfig-example.yaml  (the config of the cluster)
|
+------service.yaml ( the list and information of the  service in the cluster. The list of customized docker image)
|
+------readmd.md
```

#### Service.yaml

After you finish adding information of your service to [service.yaml](service.yaml) and put your files in the corresponding path,  run deploy.py and your service will start up.

If you want to remove some default services, just comment them in [service.yaml](service.yaml) before running deploy.py.

#### Template

All templates will be instantiated by [jinja2](http://jinja.pocoo.org/).
And all the information is retrieved from clusterconfig (as in [clusterconfig-example.yaml](clusterconfig-example.yaml)).
If your service need more information, please add your property to cluster config. 
The new property should be placed in clusterinfo, machineinfo or machinelist.

#### Deploy/Test a single service 

- ```sudo ./prepare_hadoop_config.sh```

Prepare hadoop configuration. If you are not sure whether your service depends on it or not. Please don't skip this step.


- ```sudo ./docker_build -p /path/to/configuration/directory -n your_image_name```

To ensure your docker image could be built successfully.


- ```sudo ./deploy -p /path/to/configuration/directory -d -s your_service_name```

To ensure your service could be start up correctly.

- ```sudo ./bootstrap/service/clean.sh```

To ensure your service could be stopped correctly with  stop script. This script is the stop script in the service.yaml where you configured.
