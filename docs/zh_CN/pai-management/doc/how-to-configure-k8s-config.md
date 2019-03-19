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

## Customize Your kubernetes-configuration.yaml

- [Configuration Example](#example)
- [Field 1. kubernetes](#kubernetes)

### Configuration Example <a name="example"></a>

An example kubernetes-configuration.yaml file is available [here](../../../../examples/cluster-configuration/kubernetes-configuration.yaml). The yaml file includes the following fields.

### Field 1. kubernetes <a name="kubernetes"></a>

#### Overview

```YAML
kubernetes:
  cluster-dns: IP
  load-balance-ip: IP
  service-cluster-ip-range: 10.254.0.0/16
  storage-backend: etcd3
  docker-registry: docker.io/openpai
  hyperkube-version: v1.9.4
  etcd-version: 3.2.17
  apiserver-version: v1.9.4
  kube-scheduler-version: v1.9.4
  kube-controller-manager-version:  v1.9.4
  dashboard-version: v1.8.3
```

#### User `*must*` set the following fields to bootstrap a cluster

<table>
  <tr>
    <th>
      Configuration Property
    </th>
    
    <th>
      Meaning
    </th>
  </tr>
  
  <tr>
    <td>
      <pre><code>cluster-dns</code></pre>
    </td>
    
    <td>
      Find the nameserver address in /etc/resolv.conf
    </td>
  </tr>
  
  <tr>
    <td>
      <pre><code>load-balance-ip</code></pre>
    </td>
    
    <td>
      If the cluster has only one k8s-master, please set this field with the ip-address of your k8s-master. If there are more than one k8s-master, please refer to <a href="./kubernetes-ha.md">k8s high availability configuration</a>.
    </td>
  </tr>
</table>

#### Some values could use the default value

<table>
  <tr>
    <th>
      Configuration Property
    </th>
    
    <th>
      Meaning
    </th>
  </tr>
  
  <tr>
    <td>
      <pre><code>service-cluster-ip-range</code></pre>
    </td>
    
    <td>
      Please specify an ip range that does not overlap with the host network in the cluster. E.g., use the 169.254.0.0/16 link-local IPv4 address according to [RFC 3927]|(https://tools.ietf.org/html/rfc3927), which usually will not overlap with your cluster IP.
    </td>
  </tr>
  
  <tr>
    <td>
      <pre><code>storage-backend</code></pre>
    </td>
    
    <td>
      ETCD major version. If you are not familiar with etcd, please do not change it.
    </td>
  </tr>
  
  <tr>
    <td>
      <pre><code>docker-registry</code></pre>
    </td>
    
    <td>
      The docker registry used in the k8s deployment. To use the official k8s Docker images, set this field to gcr.io/google_containers, the deployment process will pull Kubernetes component's image from ```gcr.io/google_containers/hyperkube```. You can also set the docker registry to openpai.docker.io (or docker.io/pai), which is maintained by pai.
    </td>
  </tr>
  
  <tr>
    <td>
      <pre><code>hyperkube-version</code></pre>
    </td>
    
    <td>
      The version of hyperkube. If the registry is gcr, you could find the version tag <a href="https://console.cloud.google.com/gcr/images/google-containers/GLOBAL/hyperkube?gcrImageListsize=50">here</a>.
    </td>
  </tr>
  
  <tr>
    <td>
      <pre><code>etcd-version</code></pre>
    </td>
    
    <td>
      The version of etcd. If you are not familiar with etcd, please do not change it. If the registry is gcr, you could find the version tag <a href="https://console.cloud.google.com/gcr/images/google-containers/GLOBAL/etcd?gcrImageListsize=50">here</a>.
    </td>
  </tr>
  
  <tr>
    <td>
      <pre><code>apiserver-version</code></pre>
    </td>
    
    <td>
      The version of apiserver. If the registry is gcr, you could find the version tag <a href="https://console.cloud.google.com/gcr/images/google-containers/GLOBAL/kube-apiserver?gcrImageListsize=50">here</a>.
    </td>
  </tr>
  
  <tr>
    <td>
      <pre><code>kube-scheduler-version</code></pre>
    </td>
    
    <td>
      The version of kube-scheduler. If the registry is gcr, you could find the version tag <a href="https://console.cloud.google.com/gcr/images/google-containers/GLOBAL/kube-scheduler?gcrImageListsize=50">here</a>
    </td>
  </tr>
  
  <tr>
    <td>
      <pre><code>kube-controller-manager-version</code></pre>
    </td>
    
    <td>
      The version of kube-controller-manager.If the registry is gcr, you could find the version tag <a href="https://console.cloud.google.com/gcr/images/google-containers/GLOBAL/cloud-controller-manager?gcrImageListsize=50">here</a>
    </td>
  </tr>
  
  <tr>
    <td>
      <pre><code>dashboard-version</code></pre>
    </td>
    
    <td>
      The version of kubernetes-dashboard. If the registry is gcr, you could find the version tag <a href="https://console.cloud.google.com/gcr/images/google-containers/GLOBAL/kubernetes-dashboard-amd64?gcrImageListsize=50">here</a>
    </td>
  </tr>
</table>