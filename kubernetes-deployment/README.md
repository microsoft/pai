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

The script will deploy Kubernetes in a cluster. We assume each node in the cluster has a statically assigned IP and runs Ubuntu 16.04 LTS.
The following components will be deployed in the designated nodes and run in host network:
- kubelet
- apiserver
- controller-manager
- etcd
- scheduler
- dashboard
- kube-proxy 

## Prepare your cluster configuration

An example

```yaml
clusterID: your_cluster_id


clusterinfo:
  # the ip address of nameserver in your cluster
  cluster-dns: 168.63.129.16
  # the ip address of API-server
  api-servers-ip: 10.0.3.7
  # the port of API-server
  #api-server-port: 8080
  # not in the same network segment with the host machine.
  service-cluster-ip-range: 10.254.0.0/16
  # According to the etcdversion, you should fill a corresponding backend name.
  # If you are not familiar with etc, pls don't change it.
  storage-backend: etcd2
  # Fille the host's nodename who will run dashboard
  dashboard-host: 10.0.3.11
  # If you can access to gcr, we suggest to use gcr.
  dockerregistry: gcr.io/google_containers
  # http://gcr.io/google_containers/hyperkube. Or the tag in your registry.
  hyperkubeversion: v1.7.3
  # http://gcr.io/google_containers/etcd. Or the tag in your registry.
  # If you are not familiar with etc, pls don't change it.
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

  # hostname
  infra-01:
    # the nodename in kubernetes. To avoid complication of DNS issue, it is suggested to use hostip with nodename.
    # If you are confident that DNS can resolve your named host name correctly, you can specify UNIQUE_HOST_NAME
    # ensure the os user is granted sudo permission.
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

Python(2.x) and lib install:
```yaml
sudo apt-get install python python-paramiko python-yaml python-jinja2
```

Note: kubectl will be installed on this dev-box. So it can access to your kubernetes cluster.
## bootstrap

```yaml
sudo ./bootstrap.py -p yourclusterconfig.yaml
```

