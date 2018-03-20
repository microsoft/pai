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

This document explains how to deploy Kubernetes in a cluster. We assume each node in the cluster has a statically assigned IP and runs Ubuntu 16.04 LTS.
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

Please specify the cluster configuration in a yaml file. The [cluster-config-example.yaml](./cluster-config-example.yaml) is an example, where some detailed explanation is included.

## Kubernetes high-availability 

#### solution 1

Because cloud providers such as azure always have the load balance service. So when deploy pai to the cloud platform, you could chose the load-balance service to implement the high-availability.

Before bootstrap your kubernetes cluster, you should configure your load-balance. please set the backend with your master. And set the following property with the ip of the load-balance.

```yaml

api-servers-ip: load-balance IP

```

#### solution 2

If your environment don't have a load-balance service. You could add proxy node to the kuebrnetes cluster. And then implement the load-balance component to the cluster. 

Please add all the configuration or template to the following place. here we use haproxy as an example. Feel free to implement your own load-balance component.
```yaml
component_list:
  haproxy:
  - src: haproxy.yaml
    dst: src/etc/kubernetes/manifests
  - src: haproxy.cfg
    dst: src/haproxy
    
remote_deployment:
  proxy:
    listname: proxymachinelist
    component:
    - name: kubelet
    - name: haproxy
``` 

And then set the proxy node in the following place.
```yaml

proxymachinelist:

  proxy-01:
    nodename: IP
    hostip: IP
    username: username
    password: password


```

And then set the following property with the ip or vip of your load-balance.

```yaml

api-servers-ip: load-balance IP or VIP

```

#### solution 3

Not enable kubernete-ha. 
please comment following code in cluster-config.
```yaml
component_list:
  haproxy:
  - src: haproxy.yaml
    dst: src/etc/kubernetes/manifests
  - src: haproxy.cfg
    dst: src/haproxy
    
remote_deployment:
  proxy:
    listname: proxymachinelist
    component:
    - name: kubelet
    - name: haproxy
    
proxymachinelist:

  proxy-01:
    nodename: IP
    hostip: IP
    username: username
    password: password

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
        -v /path/to/your/cluster-configuration:/cluster-configuration  \
        -v /var/lib/docker:/varl/lib/docker \
        -v /var/run/docker.sock:/var/run/docker.sock \
        --pid=host \
        --privileged=true \
        --net=host \
        --name=deployment \
        kubernetes-deployment
sudo docker exec -it deployment /bin/bash
cd /pai/kubernetes-deployment
        
```



## bootstrap

```bash
sudo ./bootstrap.py -p yourclusterconfig.yaml -a deploy
```

## Destroy your cluster
```bash
sudo ./bootstrap.py -p yourclusterconfig.yaml -a clean
```

## Only install kubectl into your dev-box
```bash
sudo ./bootstrap.py -p yourclusterconfig.yaml -a install_kubectl
```

## Add new nodes to your cluster
```bash
sudo ./bootstrap.py -p yourclusterconfig.yaml -f yournodelist.yaml -a add
```

## Remove nodes from your cluster
```bash
sudo ./bootstrap.py -p yourclusterconfig.yaml -f yournodelist.yaml -a remove
```


## Repair the worker node with the unhealthy states
```bash
sudo ./bootstrap.py -p yourclusterconfig.yaml -f yournodelist.yaml -a repair
```


## Repair the crashed etcd node (kubernetes failed to restart it) 
```bash
sudo ./bootstrap.py -p yourclusterconfig.yaml -f yournodelist.yaml -a etcdfix
```

