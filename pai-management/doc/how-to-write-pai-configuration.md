## Configuration

Before deploy or maintain pai on your cluster, you should finish configuring the cluster-configuration first.

Note: Don't change the name of the file. And those 4 files should be put in the same directory.


You could find the configuration in this path: [pai/cluster-configuration/][../../cluster-configuration]

## Index

- [cluster-configuration.yaml](#cluster_configuration)
- [k8s-role-definition.yaml](#k8s_role_definition)
- [kubernetes-configuration.yaml](#kubernetes_configuration)
- [serivices-configuration.yaml](#services_configuration)
- [Kubernetes High Availability Configuration](#k8s-high-availability-configuration)

## cluster-configuration.yaml <a name="cluster_configuration"></a>

#### ```default-machine-properties```

```YAML
default-machine-properties:
  # Account with root permission
  username: username
  password: password
  sshport: port
```

In this field, you could set the default value such as username, password and sshport. If those 3 properties is empty in your machine list, paictl will use the default value to ssh to your machine.

Note: The user should be with sudo permission.

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
- ```sshport, username, password```: Optional. If this machine's account and port is different from the default properties, you should fill these 3 fields. Or you can remove them.
- ```k8s-role```: Required. You could set this value to ```master```, ```worker``` or ```proxy```. This field is relative to kubernetes ha. if you want to configure more then 1 k8s-master, please refer to this [chapter]((#k8s-high-availability-configuration)).
- ```dashboard```: Select one node to set this field. And set the value as ``` "true" ```.
- ```zkid```: Pai-Master Required. You can set this filed from ```1``` to ```n```
- ```pai-master```: Optional. hadoop-name-node, hadoop-resource-manager, frameworklauncher, restserver, webportal, grafana, prometheus and node-exporter.
- ```pai-worker```: Optional. hadoop-data-node, hadoop-node-manager, node-exporter.
- ```node-exporter```: Optional. Some machine may not have ```pai-master``` and ```pai-worker``` labels. You should assign this label to the node.


## k8s-role-definition.yaml <a name="k8s_role_definition"></a>

Don't change this configuration.

But you can find how many roles does k8s-role have. And what service will be bootstrap on the role
.

## kubernetes-configuration.yaml <a name="kubernetes_configuration"></a>

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

#### ```Some important value should set according to the specific cluster  ```

- ```cluster-dns```: Find the namesever address in  /etc/resolv.conf
- ```load-balance-ip```: If in your cluster, there is only on k8s-master, you should set this field with the ip-address of your k8s-master. If there are many k8s-master, please refer to this [chapter](#k8s-high-availability-configuration).
- ```service-cluster-ip-range```: In this field, you should specify an ip range which shouldn't overlap with your current host's ip in your cluster.
- ```docker-registry```: If you are in a region that cannot access the gcr.io, you can change it to docker.io/openpai. This registry is used for installing k8s cluster only, will pull k8s images from it.



#### ```Some values could use the default value```
- ```storage-backend```: If you are not familiar with etcd, please don't change it.
- ```docker-registry```: The docker registry used in the k8s deployment. If you can access to gcr, we suggest to use gcr. After set this field with gcr.io/google_containers, your kubernetes component's image will pull from ```gcr.io/google_containers/hyperkube```
- ```hyperkube-version```: The version of hyperkube. If the registry is gcr, you could find the version tag [here](https://console.cloud.google.com/gcr/images/google-containers/GLOBAL/hyperkube?gcrImageListsize=50).
- ```etcd-version```: The version of etcd. If you are not familiar with etcd, please don't change it. If the registry is gcr, you could find the version tag [here](https://console.cloud.google.com/gcr/images/google-containers/GLOBAL/etcd?gcrImageListsize=50).
- ```apiserver-version```: The version of apiserver. If the registry is gcr, you could find the version tag [here](https://console.cloud.google.com/gcr/images/google-containers/GLOBAL/kube-apiserver?gcrImageListsize=50).
- ```kube-scheduler-version```: The version of kube-scheduler. If the registry is gcr, you could find the version tag [here](https://console.cloud.google.com/gcr/images/google-containers/GLOBAL/kube-scheduler?gcrImageListsize=50)
- ```kube-controller-manager-version```: The version of kube-controller-manager.If the registry is gcr, you could find the version tag [here](https://console.cloud.google.com/gcr/images/google-containers/GLOBAL/cloud-controller-manager?gcrImageListsize=50)
- ```dashboard-version```: The version of kubernetes-dashboard. If the registry is gcr, you could find the version tag [here](https://console.cloud.google.com/gcr/images/google-containers/GLOBAL/kubernetes-dashboard-amd64?gcrImageListsize=50)

## serivices-configuration.yaml <a name="services_configuration"></a>

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
- ```nvidia-drivers-version```: Choose proper nvidia driver version for your cluster from this [url](http://www.nvidia.com/object/linux-amd64-display-archive.html)
- ```docker-verison```: Docker client used by hadoop NM (node manager) to launch Docker containers (e.g., of a deep learning job) in the host env. Choose a version from this [url](https://download.docker.com/linux/static/stable/x86_64/)
- ```data-path```: The absolute path on the host in your cluster where you wanna store your data such as hdfs, zookeeper and yarn. Note: please be sure there is enough space.
- ```docker-registry-info```:
    - ```docker-namespace```: Your registry's namespace. If your choose DockerHub as your docker registry. You should fill this field with your username.
    - ```docker-registry-domain```: E.g., gcr.io. If public，fill docker_registry_domain with word "public"
    - ```docker-username```: The account of the docker registry
    - ```docker-password```: The password of the account
    - ```docker-tag```: The image tag of the service. You could set the version here. Or just set latest here.
    - ```secret-name```: An id, used by k8s.

Note that PAI team provides a read-only public docker registry on DockerHub for official releases. To use this docker registry, th `docker-registry-info` section should be configured as follows, leaving `docker-username` and `docker-password` commented:

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

- ```custom-hadoop-binary-path```: If you wanna to use hadoop-ai (A hadoop patched version developed by PAI. [More detail](../../hadoop-ai)) please set a path here. And paictl will build hadoop-ai, and place the binary to the path. If you don't wanna use hadoop-ai, set ```None``` here.
- ```hadoop-version```: If you will build hadoop-ai and use it, you should set this as ```2.7.2```. If you set path as ```None```, please choose a version [here](http://archive.apache.org/dist/hadoop/common/).
- ```virtualClusters```: hadoop queue setting.


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

#### ```Deploy Kubernetes With Single Master Node```

Not enable kubernete-ha.

- only set one node's k8s-role as master.
- set this field ```load-balance-ip``` with the value of your master's ip address

#### ```Deploy Kubernetes with ha and deploy proxy through pai```

There are 3 roles in [k8s-role-definition](../../cluster-configuration/k8s-role-definition.yaml). The ```master``` will start k8s-master component on the target machine. And the ```proxy``` will start proxy component on the target machine.

- One or more than one nodes are labeled with ```k8s-role: master```
- One node should be labeled with ```k8s-role: proxy```
- set this field ```load-balance-ip``` with the value of your proxy node's ip address

Node: the proxy node is not in ha mode. If you wanna set proxy in ha-mode, you need customized the role ```proxy```. Or you can create a new role, and create the new rule to deploy k8s on a node.

#### ```Setup k8s-ha iwith the cloud providers's load-balance service```

If your cluster are in the cloud environment such as Azure. You could set the load-balancer through the cloud service.

Before bootstrap your kubernetes cluster, you should configure your load-balance. please set the backend with your master. And set the following property with the ip of the load-balance in the kubernetes-configuration.yaml.

- set the field ```load-balance-ip`` with the ip-address of your cloud load-balancer.


