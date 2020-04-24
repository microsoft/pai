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


## Customize Your service-configuration.yaml

### Index
- [Configuration Example](#example)
- [Necessary Configuration](#necessary)
- [Customized Configuration (Optional)](#optional)

### Configuration Example <a name="example"></a>
An example service-configuration.yaml file is available [here](../../../examples/cluster-configuration/services-configuration.yaml). The yaml file includes the following fields.

### Necessary Configuration - Minimal configuration to setup OpenPAI <a name="necessary"></a>

There are only 2 mandatory configuration for admin to configure in ```service-configuration.yaml```. And see the yaml format data following.

```YAML
rest-server:
  # database admin username
  default-pai-admin-username: your_default_pai_admin_username
  # database admin password
  default-pai-admin-password: your_default_pai_admin_password
```  

### Customized Configuration - For advanced user <a name="optional"></a>

Besides the default cofiguration to make OpenPAI start, admin could customize each service component within permissible scope. From the example ```serivce-configuration.yaml```, you could find a lot of commented fileds, such as the following. For example, If you wanna customize ```cluster```, you can uncomment the filed, and overwrite the default value with your expected value. 
```YAML
#cluster:
#
#  common:
#    cluster-id: pai
#    cluster-type: k8s
#
#    # HDFS, zookeeper data path on your cluster machine.
#    data-path: "/datastorage"
#
#    # Enable job history feature. Default value is "true"
#    job-history: "true"
#
#    # Enable QoS feature or not. Default value is "true"
#    qos-switch: "true"
#
#    # If your cluster is created by Azure and the machine is rdma enabled.
#    # Set this configuration as  "true", the rdma environment will be set into your container.
#    az-rdma: "false"
#    # If RBAC is enabled in your cluster, you should set this value to true.
#    # If RBAC is enabled in your cluster, please ensure the kubeconfig for paictl has enough permission.
#    k8s-rbac: "false"
#
#    # If Pai will be deployed in aks, you should set this value to true.
#    deploy-in-aks: "false"
#
#  # the docker registry to store docker images that contain system services like frameworklauncher, hadoop, etc.
#  docker-registry:
#
#    # domain/namespace/image-name:tag
#
#    # If resgiry is docker.io, please fill it the same as your username
#    namespace: openpai
#
#    # E.g., gcr.io.
#    # If your registry is at hub.docker, please fill it as docker.io
#    domain: docker.io
#
#    # If the docker registry doesn't require authentication, please comment out username and password
#    #username: your_registry_username
#    #password: your_registry_password
#
#    tag: latest
#
#    # The name of the secret in kubernetes will be created in your cluster
#    # Must be lower case, e.g., regsecret.
#    secret-name: regsecret
```  


According to your requirements, choose the component which you wanna customized. Please read the table and the link in the table carefully. 

| Service | Description | Tutorial |
| --- | --- | --- |
| cluster <a name="ref_cluster_config"></a>| Configure data-path, cluster-id, azure rdma switch and docker-registry to pull image. | [Link](../../../src/cluster/config/cluster.md)|
| rest-server <a name="ref_rest_server"></a>| admin account, jwt-secret | [Link](../../../src/rest-server/config/rest-server.md)|
| webportal | webportal port configuration| [Link](../../../src/webportal/config/webportal.md)|
| grafana | grafana port configuration| [Link](../../../src/grafana/config/grafana.md)|
| node-exporter | node-exporter port configuration| [Link](../../../src/node-exporter/config/node-exporter.md)|
| alert-manager | port configuration and alerts email configuration | [Link](../../../src/alert-manager/config/alert-manager.md)|
| prometheus | port configuration and scrape interval configuration | [Link](../../../src/prometheus/config/prometheus.md)|
| pylon | port configuration | [Link](../../../src/pylon/config/pylon.md)|









