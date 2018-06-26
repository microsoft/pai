# PAI Configuration

Before deployment or maintenance, user should have the cluster configuration files ready.

You could find the example configuration files in [pai/cluster-configuration/](../../cluster-configuration).

Note: Please do not change the name of the configuration files. And those 4 files should be put in the same directory.


## Index

- [Set up cluster-configuration.yaml](#cluster_configuration)
- [Set up k8s-role-definition.yaml](#k8s_role_definition)
- [Set up kubernetes-configuration.yaml](#kubernetes_configuration)
- [Set up serivices-configuration.yaml](#services_configuration)
- [Kubernetes High Availability Configuration](#k8s-high-availability-configuration)

## Set up cluster-configuration.yaml <a name="cluster_configuration"></a>

An example cluster-configuration.yaml is available [here](../../cluster-configuration/cluster-configuration.yaml). In the following we explain the fields in the yaml file one by one.

### ```default-machine-properties```

```YAML
default-machine-properties:
  # A Linux host account with sudo permission
  username: username
  password: password
  sshport: port
```

Set the default value of username, password, and sshport in default-machine-properties. PAI will use these default values to access cluter machines. User can override the default access information for each machine in [machine-list](#m_list).

### ```machine-sku```

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

### ```machine-list``` <a name="m_list"></a>

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
- ```zkid```: Unique zookeeper id required by ```pai-master``` node(s). You can set this field from ```1``` to ```n```
- ```pai-worker```: Optional. hadoop-data-node, hadoop-node-manager, and node-exporter will be deployed on a pai-work.
- ```node-exporter```: Optional. You can assign this label to nodes to enable hardware and service monitoring.

Note: To deploy PAI in a single box, users should set pai-master and pai-worker labels for the same machine in machine-list section, or just follow the quick deployment approach described in this [section](./single-box-deployment.md).

## Set up k8s-role-definition.yaml <a name="k8s_role_definition"></a>

An example k8s-role-definition.yaml file is available [here](../../cluster-configuration/k8s-role-definition.yaml).
The file is used to bootstrap a k8s cluster. It includes a list of k8s components and specifies what components should be include in different k8s roles (master, worker, and proxy).
By default, user does not need to change the file.

## Set up kubernetes-configuration.yaml <a name="kubernetes_configuration"></a>

An example kubernetes-configuration.yaml file is available [here](../../cluster-configuration/kubernetes-configuration.yaml). The yaml file includes the following fields.

```
kubernetes:
  cluster-dns: IP
  load-balance-ip: IP
  service-cluster-ip-range: 10.254.0.0/16
  storage-backend: etcd3
  docker-registry: docker.io/pai
  hyperkube-version: v1.9.4
  etcd-version: 3.2.17
  apiserver-version: v1.9.4
  kube-scheduler-version: v1.9.4
  kube-controller-manager-version:  v1.9.4
  # http://gcr.io/google_containers/kubernetes-dashboard-amd64
  dashboard-version: v1.8.3
```

### ```User *must* set the following fields to bootstrap a cluster ```

- ```cluster-dns```: Find the namesever address in  /etc/resolv.conf
- ```load-balance-ip```: If the cluster has only one k8s-master, please set this field with the ip-address of your k8s-master. If there are more than one k8s-master, please refer to [k8s high availability configuration](#k8s-high-availability-configuration).

### ```Some values could use the default value```
- ```service-cluster-ip-range```: Please specify an ip range that does not overlap with the host network in the cluster. E.g., use the 169.254.0.0/16 link-local IPv4 address according to [RFC 3927](https://tools.ietf.org/html/rfc3927), which usually will not overlap with your cluster IP.
- ```storage-backend```: ETCD major version. If you are not familiar with etcd, please do not change it.
- ```docker-registry```: The docker registry used in the k8s deployment. To use the official k8s Docker images, set this field to gcr.io/google_containers, the deployment process will pull Kubernetes component's image from ```gcr.io/google_containers/hyperkube```. You can also set the docker registry to openpai.docker.io (or docker.io/pai), which is maintained by pai.
- ```hyperkube-version```: The version of hyperkube. If the registry is gcr, you could find the version tag [here](https://console.cloud.google.com/gcr/images/google-containers/GLOBAL/hyperkube?gcrImageListsize=50).
- ```etcd-version```: The version of etcd. If you are not familiar with etcd, please do not change it. If the registry is gcr, you could find the version tag [here](https://console.cloud.google.com/gcr/images/google-containers/GLOBAL/etcd?gcrImageListsize=50).
- ```apiserver-version```: The version of apiserver. If the registry is gcr, you could find the version tag [here](https://console.cloud.google.com/gcr/images/google-containers/GLOBAL/kube-apiserver?gcrImageListsize=50).
- ```kube-scheduler-version```: The version of kube-scheduler. If the registry is gcr, you could find the version tag [here](https://console.cloud.google.com/gcr/images/google-containers/GLOBAL/kube-scheduler?gcrImageListsize=50)
- ```kube-controller-manager-version```: The version of kube-controller-manager.If the registry is gcr, you could find the version tag [here](https://console.cloud.google.com/gcr/images/google-containers/GLOBAL/cloud-controller-manager?gcrImageListsize=50)
- ```dashboard-version```: The version of kubernetes-dashboard. If the registry is gcr, you could find the version tag [here](https://console.cloud.google.com/gcr/images/google-containers/GLOBAL/kubernetes-dashboard-amd64?gcrImageListsize=50)

## Set up serivices-configuration.yaml <a name="services_configuration"></a>

An example services-configuration.yaml file is available [here](../../cluster-configuration/services-configuration.yaml). The following explains the details of the yaml file.

### ```cluster```

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
    - ```docker-tag```: The image tag of the service, which should match the PAI release version, for example: `pai-0.6.y` for the release 0.6. Or use `latest` for the latest code.
    - ```secret-name```: Must be lower case, e.g., regsecret. The name of the secret in Kubernetes will be created for your cluster.

Note that we provide a read-only public docker registry on DockerHub for official releases. To use this docker registry, th `docker-registry-info` section should be configured as follows, leaving `docker-username` and `docker-password` commented:

```yaml
docker-registry-info:
  - docker-namespace: openpai
  - docker-registry-domain: docker.io
  #- docker-username: <n/a>
  #- docker-password: <n/a>
  - docker-tag: pai-0.6.y # the image tag for PAI release 0.6
  - secret-name: <anything>
```

Users can browse to https://hub.docker.com/r/openpai to see all the repositories in this public docker registry.

### ```hadoop```
```YAML
hadoop:
  # custom_hadoop_binary_path specifies the path PAI stores the custom built hadoop-ai
  # Notice: the name should be hadoop-{hadoop-version}.tar.gz
  custom-hadoop-binary-path: /pathHadoop/hadoop-2.7.2.tar.gz
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

- ```custom-hadoop-binary-path```: please set a path here for paictl to build [hadoop-ai](../../hadoop-ai).
- ```hadoop-version```: please set this to ```2.7.2```.
- ```virtualClusters```: hadoop queue setting. Each VC will be assigned with (capacity / total_capacity * 100%) of resources. paictl will create the 'default' VC with 0 capacity, if it is not been specified. paictl will split resources to each VC evenly if the total capacity is 0. The capacity of each VC will be  set to 0 if it is a negative number.


### ```frameworklauncher```

```
frameworklauncher:
  frameworklauncher-port: 9086
```

- ```frameworklauncher-port```: Launcher's port. You can use the default value.

### ```restserver```

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


### ```webportal```

```
webportal:
  server-port: 9286
```

- ```server-port```: port for webportal, you can use the default value.


### ```grafana```

```
grafana:
  grafana-port: 3000
```

- ```grafana```: port for grafana, you can use the default value.

### ```prometheus```

```
prometheus:
  prometheus-port: 9091
  node-exporter-port: 9100
```

- ```prometheus-port```: port for prometheus port, you can use the default value.
- ```node-exporter-port```: port for node exporter, you can use the default value.

### ```pylon```

```
pylon:
  # port of pylon
  port: 80
```

- ```port```: port of pylon, you can use the default value.

## Kubernetes and High Availability (HA) <a name="k8s-high-availability-configuration"></a>

### ```Deploy Kubernetes on a Single Master Node (without HA)```

Single master mode does not have high availability.

- only set one node's k8s-role as master
- set this field ```load-balance-ip``` to your master's ip address

### ```Kubernetes with High Availability: The `proxy` Role```

There are 3 roles in [k8s-role-definition](../../cluster-configuration/k8s-role-definition.yaml). The ```master``` will start a k8s-master component on the specified machine. And the ```proxy``` will start a proxy component on the specified machine. In cluster-configuration.yaml,

- one or more than one nodes are labeled with ```k8s-role: master```
- one node should be labeled with ```k8s-role: proxy```
- set the field ```load-balance-ip``` to your proxy node's ip address

Node: the proxy node itself is not in ha mode. How to configure the proxy node in ha mode is out of the scope of PAI deployment.

### ```Kubernetes with High Availability: External Load Balancer```

If your cluster has a reliable load-balance server (e.g. in a cloud environment such as Azure), you could set up a load-balancer and set the field ```load-balance-ip``` in the kubernetes-configuration.yaml to the load-balancer.

- Set the field ```load-balance-ip`` to the ip-address of your load-balancer.


