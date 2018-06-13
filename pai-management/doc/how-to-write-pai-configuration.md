## Configuration

Before deploy or maintain pai on your cluster, you should finish configuring the cluster-configuration first.

Note: Don't change the name of the file. And those 4 files should be put in the same directory.


You could find the configuration in this path: [pai/cluster-configuration/](../../cluster-configuration)

## Index

- [cluster-configuration.yaml](#cluster_configuration)
- [k8s-role-definition.yaml](#k8s_role_definition)
- [kubernetes-configuration.yaml](#kubernetes_configuration)
- [serivices-configuration.yaml](#services_configuration)
- [Kubernetes High Availability Configuration](#k8s-high-availability-configuration)

## cluster-configuration.yaml <a name="cluster_configuration"></a>

An example cluster-configuration.yaml is available [here](../../cluster-configuration/cluster-configuration.yaml). In the following we explain the fields in the yaml file one by one.

#### ```default-machine-properties```

```YAML
default-machine-properties:
  # Account with sudo permission
  username: username
  password: password
  sshport: port
```

Set the default value of username, password, and sshport in default-machine-properties. 
If not specified otherwise, PAI will use the default values to access cluter machines.

#### ```machine-sku```

```YAML
machine-sku:

  NC24R:
    mem: 224
    gpu:
      type: teslak80
      count: 4
    cpu:
      vcore: 24
    #Note: Up to now, the only supported os version is Ubuntu16.04. Please do not change it here.
    os: ubuntu16.04

```

In this field, you could define several sku with different name. And in the machine list you should refer your machine to one of them.

- mem: memory
- gpu: If there is no gpu on this sku, you could remove this field
- os: Now we only supported ubuntu, and pai is only tested on the version 16.04LTS.

#### ```machine-list```

```
machine-list:

    - hostname: hostname (echo `hostname`)
      hostip: IP
      machine-type: D8SV3
      etcdid: etcdid1
      #sshport: PORT (Optional)
      #username: username (Optional)
      #password: password (Optional)
      k8s-role: master
      dashboard: "true"
      zkid: "1"
      pai-master: "true"

    - hostname: hostname
      hostip: IP
      machine-type: D8SV3
      etcdid: etcdid2
      #sshport: PORT (Optional)
      #username: username (Optional)
      #password: password (Optional)
      k8s-role: master
      node-exporter: "true"

    - hostname: hostname
      hostip: IP
      machine-type: NC24R
      #sshport: PORT (Optional)
      #username: username (Optional)
      #password: password (Optional)
      k8s-role: worker
      pai-worker: "true"
```

- ```hostname```: Required. You could the hostname by the command ```echo `hostname` ``` on the host.
- ```hostip```: Required. The ip address of the corresponding host.
- ```machine-type```: Required. The sku name defined in the ```machine-sku```.
- ```etcdid```: K8s-Master Required. The etcd is part of kuberentes master. If you assign the k8s-role=master to a node, you should set this filed. This value will be used when starting and fixing k8s.
- ```sshport, username, password```: Optional. Used if this machine's account and port is different from the default properties. Or you can remove them.
- ```k8s-role```: Required. You could set this value to ```master```, ```worker``` or ```proxy```. If you want to configure more than 1 k8s-master, please refer to [Kubernetes High Availability Configuration](#k8s-high-availability-configuration).
- ```dashboard```: Select one node to set this field. And set the value as ``` "true" ```.
- ```pai-master```: Optional. hadoop-name-node, hadoop-resource-manager, frameworklauncher, restserver, webportal, grafana, prometheus and node-exporter.
- ```zkid```: Unique zookeeper id. Required by```pai-Master```. You can set this filed from ```1``` to ```n```
- ```pai-worker```: Optional. hadoop-data-node, hadoop-node-manager, and node-exporter will be deployed on a pai-work.
- ```node-exporter```: Optional. Some machine may not have ```pai-master``` and ```pai-worker``` labels. You can assign this label to the node.


## k8s-role-definition.yaml <a name="k8s_role_definition"></a>

An example k8s-role-definition.yaml file is available [here](../../cluster-configuration/k8s-role-definition.yaml).
The file is used to bootstrap a k8s cluster. It includes a list of k8s components and specifies what components should be include in different k8s roles (master, worker, and proxy). 
By default, user does not need to change the file.

## kubernetes-configuration.yaml <a name="kubernetes_configuration"></a>

An example kubernetes-configuration.yaml file is available [here](../../cluster-configuration/kubernetes-configuration.yaml). The yaml file includes the following fields.

```
kubernetes:
  cluster-dns: IP
  load-balance-ip: IP
  service-cluster-ip-range: 169.254.0.0/16
  storage-backend: etcd3
  docker-registry: gcr.io/google_containers
  hyperkube-version: v1.9.4
  etcd-version: 3.2.17
  apiserver-version: v1.9.4
  kube-scheduler-version: v1.9.4
  kube-controller-manager-version:  v1.9.4
  # http://gcr.io/google_containers/kubernetes-dashboard-amd64
  dashboard-version: v1.8.3
```

#### ```User *must* set the following fields to bootstrap a cluster ```

- ```cluster-dns```: Find the namesever address in  /etc/resolv.conf
- ```load-balance-ip```: If the cluster has only one k8s-master, please set this field with the ip-address of your k8s-master. If there are many k8s-master, please refer to [k8s high availability configuration](#k8s-high-availability-configuration).

#### ```Some values could use the default value```
- ```service-cluster-ip-range```: Please specify an ip range that does not overlap with the host network in the cluster. 169.254.0.0/16 link-local IPv4 address according to [RFC 3927](https://tools.ietf.org/html/rfc3927), which usually will not overlap with your cluster IP.
- ```storage-backend```: ETCD major version. If you are not familiar with etcd, please do not change it.
- ```docker-registry```: The docker registry used in the k8s deployment. If you can access gcr, we suggest to use gcr. Set this field to gcr.io/google_containers, the deployment process will Kubernetes component's image from ```gcr.io/google_containers/hyperkube```
- ```hyperkube-version```: The version of hyperkube. If the registry is gcr, you could find the version tag [here](https://console.cloud.google.com/gcr/images/google-containers/GLOBAL/hyperkube?gcrImageListsize=50).
- ```etcd-version```: The version of etcd. If you are not familiar with etcd, please do not change it. If the registry is gcr, you could find the version tag [here](https://console.cloud.google.com/gcr/images/google-containers/GLOBAL/etcd?gcrImageListsize=50).
- ```apiserver-version```: The version of apiserver. If the registry is gcr, you could find the version tag [here](https://console.cloud.google.com/gcr/images/google-containers/GLOBAL/kube-apiserver?gcrImageListsize=50).
- ```kube-scheduler-version```: The version of kube-scheduler. If the registry is gcr, you could find the version tag [here](https://console.cloud.google.com/gcr/images/google-containers/GLOBAL/kube-scheduler?gcrImageListsize=50)
- ```kube-controller-manager-version```: The version of kube-controller-manager.If the registry is gcr, you could find the version tag [here](https://console.cloud.google.com/gcr/images/google-containers/GLOBAL/cloud-controller-manager?gcrImageListsize=50)
- ```dashboard-version```: The version of kubernetes-dashboard. If the registry is gcr, you could find the version tag [here](https://console.cloud.google.com/gcr/images/google-containers/GLOBAL/kubernetes-dashboard-amd64?gcrImageListsize=50)

## serivices-configuration.yaml <a name="services_configuration"></a>

An example services-configuration.yaml file is available [here](../../cluster-configuration/services-configuration.yaml). The following explains the details of the yaml file.

#### ```cluster```

```
cluster:

  clusterid: pai-example
  nvidia-drivers-version: 384.111
  docker-verison: 17.06.2
  data-path: "/datastorage"
  docker-registry-info:

    docker-namespace: your_registry_namespace
    docker-registry-domain: your_registry_domain
    # If the docker registry doesn't require authentication, please leave docker_username and docker_password empty
    docker-username: your_registry_username
    docker-password: your_registry_password

    docker-tag: your_image_tag

    # The name of the secret in kubernetes will be created in your cluster
    # Must be lower case, e.g., regsecret.
    secret-name: your_secret_name
```


- ```clusterid```: The id of the cluster.
- ```nvidia-drivers-version```: Choose proper nvidia driver version for your cluster [here](http://www.nvidia.com/object/linux-amd64-display-archive.html).
- ```docker-verison```: The Docker client used by hadoop NM (node manager) to launch Docker containers (e.g., of a deep learning job) in the host environment. Choose a version [here](https://download.docker.com/linux/static/stable/x86_64/).
- ```data-path```: The absolute path on the host in your cluster to store the data such as hdfs, zookeeper and yarn. Note: please make sure there is enough space in this path.
- ```docker-registry-info```:
    - ```docker-namespace```: Your registry's namespace. If your choose DockerHub as your docker registry. You should fill this field with your username.
    - ```docker-registry-domain```: E.g., gcr.io. If public，fill docker_registry_domain with the word "public".
    - ```docker-username```: The account of the docker registry
    - ```docker-password```: The password of the account
    - ```docker-tag```: The image tag of the service. You could set the version here. Or just set latest here.
    - ```secret-name```: Must be lower case, e.g., regsecret. The name of the secret in Kubernetes will be created for your cluster. 

Note that we provide a read-only public docker registry on DockerHub for official releases. To use this docker registry, th `docker-registry-info` section should be configured as follows, leaving `docker-username` and `docker-password` commented:

```yaml
docker-registry-info:
  - docker-namespace: openpai
  - docker-registry-domain: docker.io
  #- docker-username: <n/a>
  #- docker-password: <n/a>
  - docker-tag: latest # or a specific version, i.e. 0.5.0.
  - secret-name: <anything>
```

Users can browse to https://hub.docker.com/r/openpai to see all the repositories in this public docker registry.

#### ```hadoop```
```YAML
hadoop:
  # If custom_hadoop_binary_path is None, script will download a standard version of hadoop binary for you
  # hadoop-version
  # http://archive.apache.org/dist/hadoop/common/hadoop-2.7.2/hadoop-2.7.2.tar.gz
  custom-hadoop-binary-path: None
  hadoop-version: 2.7.2
  virtualClusters:
    default:
      description: default queue for all users.
      capacity: 40
    vc1:
      description: VC for Alice's team.
      capacity: 20
    vc2:
      description: VC for Bob's team.
      capacity: 20
    vc3:
      description: VC for Charlie's team.
      capacity: 20
```

- ```custom-hadoop-binary-path```: If you would like to use [hadoop-ai](../../hadoop-ai), please set a path here. And paictl will build hadoop-ai, and place the binary to the path. If you do not use hadoop-ai, set ```None``` here.
- ```hadoop-version```: If you will build hadoop-ai and use it, you should set this to ```2.7.2```. If you set path as ```None```, please choose a version [here](http://archive.apache.org/dist/hadoop/common/).
- ```virtualClusters```: hadoop queue setting. The sum of capacity should be 100.


#### ```frameworklauncher```

```
frameworklauncher:
  frameworklauncher-port: 9086
```

- ```frameworklauncher-port```: Launcher's port. You can use the default value.

#### ```restserver```

```
restserver:
  server-port: 9186
  jwt-secret: your_jwt_secret
  default-pai-admin-username: your_default_pai_admin_username
  default-pai-admin-password: your_default_pai_admin_password
```

- ```server-port```: Port for rest api server. You can use the default value.
- ```jwt-secret```: secret for signing authentication tokens, e.g., "Hello PAI!"
- ```default-pai-admin-username```: database admin username, and admin username of pai.
- ```default-pai-admin-password```: database admin password


#### ```webportal```

```
webportal:
  server-port: 9286
```

- ```server-port```: port for webportal, you can use the default value.


#### ```grafana```

```
grafana:
  grafana-port: 3000
```

- ```grafana```: port for grafana, you can use the default value.

#### ```prometheus```

```
prometheus:
  prometheus-port: 9091
  node-exporter-port: 9100
```

- ```prometheus-port```: port for prometheus port, you can use the default value.
- ```node-exporter-port```: port for node exporter, you can use the default value.

#### ```pylon```

```
pylon:
  # port of pylon
  port: 80
```

- ```port```: port of pylon, you can use the default value.

## Kubernetes High Availability Configuration <a name="k8s-high-availability-configuration"></a>

#### ```Deploy Kubernetes on a Single Master Node```

Single master mode does not have high availability.

- only set one node's k8s-role as master
- set this field ```load-balance-ip``` to your master's ip address

#### ```Deploy Kubernetes with ha and deploy proxy through pai```

There are 3 roles in [k8s-role-definition](../../cluster-configuration/k8s-role-definition.yaml). The ```master``` will start a k8s-master component on the specified machine. And the ```proxy``` will start a proxy component on the specified machine. In cluster-configuration.yaml,

- one or more than one nodes are labeled with ```k8s-role: master``` 
- one node should be labeled with ```k8s-role: proxy```
- set the field ```load-balance-ip``` to your proxy node's ip address

Node: the proxy node itself is not in ha mode. How to configure the proxy node in ha mode is out of the scope of PAI deployment.

#### ```Setup k8s-ha with a reliable load-balance service```

If your cluster has a reliable laod-balance server (e.g. in a cloud environment such as Azure), you could set up a load-balancer and set the field ```load-balance-ip``` in the kubernetes-configuration.yaml to the load-balancer.

- Set the field ```load-balance-ip`` to the ip-address of your load-balancer.


