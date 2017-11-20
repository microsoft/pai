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

# Kuberentes Deployment in cluster

This document explains how to deploy Kubernetes in a cluster. We assume each node in the cluster has a statically assigned IP and runs Ubuntu 16.04 LTS.
The following k8s components will be deployed in the designated nodes and run in host network:
- kubelet
- apiserver
- controller-manager
- etcd
- scheduler
- dashboard
- kube-proxy 

Each k8s component runs in a docker container. If Docker is missing in the OS, the script will install the latest Docker version.

## Prepare your cluster configuration

An example

```yaml
clusterID: your_cluster_id


clusterinfo:
  # the ip address of nameserver in your cluster
  cluster-dns: 168.63.129.16
  # the ip address of API-server
  api-servers-ip: 10.0.3.7
  # the port of API-server, please do not change the default port number below
  #api-server-port: 8080
  # specify an IP range not in the same network segment with the host machine.
  service-cluster-ip-range: 10.254.0.0/16
  # According to the etcdversion, you should fill a corresponding backend name.
  # If you are not familiar with etcd, please don't change it.
  storage-backend: etcd2
  # Specify the host's nodename that runs dashboard
  dashboard-host: 10.0.3.11
  # The docker registry used in the k8s deployment. If you can access to gcr, we suggest to use gcr.
  dockerregistry: gcr.io/google_containers
  # http://gcr.io/google_containers/hyperkube. Or the tag in your registry.
  hyperkubeversion: v1.7.3
  # http://gcr.io/google_containers/etcd. Or the tag in your registry.
  # If you are not familiar with etcd, please don't change it.
  etcdversion: 2.2.5
  # http://gcr.io/google_containers/kube-apiserver. Or the tag in your registry.
  apiserverversion: v1.7.3
  # http://gcr.io/google_containers/kube-scheduler. Or the tag in your registry.
  kubeschedulerversion: v1.7.3
  # http://gcr.io/google_containers/kube-controller-manager
  kubecontrollermanagerversion:  v1.7.3
  # http://gcr.io/google_containers/kubernetes-dashboard-amd64
  dashboard_version: v1.6.1

# The machine list of your cluster
# An example
mastermachinelist:

  # hostname, must be the same as it in the host network
  infra-01:
    # The nodename in k8s. To avoid complication, it is suggested to fill in the hostip for the nodename.
    # If you are confident that DNS can resolve your named nodename correctly, you can specify a UNIQUE_HOST_NAME
    # hostip: the static IP of this node. We assume the IP of a host will not change.
    # username/password: the user name and password in the OS. Make sure it is granted with sudo permission
    nodename: IP
    hostip: IP
    etcdid: etcdid1
    username: username
    password: password



workermachinelist:

  worker-01:
    nodename: IP
    hostip: IP
    username: username
    password: password

  worker-02:
    nodename: IP
    hostip: IP
    username: username
    password: password

  infra-04:
    nodename: IP
    hostip: IP
    username: username
    password: password

  infra-02:
    nodename: IP
    hostip: IP
    username: username
    password: password

  infra-03:
    nodename: IP
    hostip: IP
    username: username
    password: password
```

## Prepare your dev-box environment

Make sure your dev box has full network access to the cluster.

Python(2.x) and lib install:
```yaml
sudo apt-get install python python-paramiko python-yaml python-jinja2
```

Note: kubectl will be installed on this dev-box. So it can access to your kubernetes cluster.
## bootstrap

```yaml
sudo ./bootstrap.py -p yourclusterconfig.yaml
```

