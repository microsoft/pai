# paictl

A tool to manage your pai cluster.

## Index

- [ Build PAI's Image ](#Image)
    - [ Build the service Image ](#Image_Build)
    - [ Push Image to the Docker Registry](#Image_Push)
- [ Maintain your machine ](#Machine)
    - [ Repair issued machines ](#Machine_Repair)
    - [ Add machines to the cluster ](#Machine_Add)
    - [ Remove machines from the cluster ](#Machine_Remove)
    - [ An example of node-list ](#Machine_Nodelist_Example)
- [ Maintain your service ](#Service)
    - [ Start service in the cluster ](#Service_Start)
    - [ Stop service in the cluster ](#Service_Stop)
    - [ Delete (Stop and clean Data) Service in the cluster ](#Service_Delete)
    - [ Upgrade service in the cluster ](#Service_Upgrade)
- [ Bootstrap your cluster ](#Cluster)
    - [ Bootstrap your cluster (K8S + Service) with cluster-configuration ](#Cluster_Boot)
    - [ BootStrap K8S ](#Cluster_K8s_Boot)
    - [ BootStrap service ](#Cluster_Service_Boot)
    - [ Stop K8S ](#Cluster_K8s_Stop)
    - [ Stop service ](#Cluster_Service_Stop)
    - [ Upgrading K8S version ](#Cluster_K8s_upgrade)
    - [ Generate the cluster-configuration template from a machine list ](#Cluster_Conf_Generate)
- [ Install kubectl ](#Kubectl)


## Build PAI's Image <a name="Image"></a>

#### Build PAI's Image <a name="Image_Build"></a>

```
paictl.py image build -p /path/to/cluster-configuration/dir [ -n image-name ]
```

1) Build hadoop-ai
2) Patch Our hadoop configuration
3) Build and tag the image
4) If the option -n is added, only the target image will be built and tagged.

#### Push PAI's Image to the Registry <a name="Image_Push"></a>

```
paictl.py image push -p /path/to/cluster-configuration/dir [ -n image-name ]
```

1) Push the tagged image to the registry which is configured in the cluster-configuration.
2) If the option -n is added, only the target image will be pushed.


## Maintain your machine <a name="Machine"></a>

#### Repair issued machines <a name="Machine_Repair"></a>

```
paictl.py machine repair -p /path/to/cluster-configuration/dir -l node-list.yaml
```


1) You will have to pass [a node list](#Machine_Nodelist_Example) to this command

#### Add machines to the cluster <a name="Machine_Add"></a>

```
paictl.py machine add -p /path/to/cluster-configuration/dir -l node-list.yaml
```

1) You will have to pass [a node list](#Machine_Nodelist_Example) to this command

#### Remove machines from the cluster <a name="Machine_Remove"></a>

```
paictl.py machine remove -p /path/to/cluster-configuration/dir -l node-list.yaml
```

1) You will have to pass [a node list](#Machine_Nodelist_Example) to this command


#### An example of node-list <a name="Machine_Nodelist_Example"></a>

An example of machine in the machine list
```yaml

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
      pai-master: "true

    - hostname: hostname
      hostip: IP
      machine-type: NC24R
      #sshport: PORT (Optional)
      #username: username (Optional)
      #password: password (Optional)
      k8s-role: worker
      pai-worker: "true"

```

## Maintain your service <a name="Service"></a>

#### Start service in the cluster <a name="Service_Start"></a>

```
paictl.py service start -p /path/to/cluster-configuration/dir [ -n service-name ]
```

1) Starting all service in your cluster.
2) If the option -n is set, only the target service will be deployed.


#### Stop service in the cluster <a name="Service_Stop"></a>

```
paictl.py service stop -p /path/to/cluster-configuration/dir [ -n service-name ]
```

1) Stop all service in your cluster.
2) If the option -n is set, only the target service will be stopped.


#### Delete (Stop and clean Data) Service in the cluster <a name="Service_Delete"></a>

```
paictl.py service delete -p /path/to/cluster-configuration/dir [ -n service-name ]
```

1) Firstly, it will stop all service on your cluster.
2) Secondly, it will delete all service data which has been persistenced on the local host such as hdfs, yarn, zookeeper etc.
3) If the option -n is set, only the target service will be stopped and deleted.

#### Upgrade service in the cluster <a name="Service_Delete"></a>

```
paictl.py service upgrade -p /path/to/cluster-configuration/dir [ -n service-name ]
```

1) Firstly, it will refresh the label on each node.
2) If the option -n is set, only the target service will be upgrade.


## Bootstrap your cluster <a name="Cluster"></a>

#### Bootstrap your cluster (K8S + Service) with cluster-configuration <a name="Cluster_Boot"></a>

```
paictl.py cluster bootstrap -p /path/to/clsuster-configuration/dir
```

1) Bootstrap k8s cluster
2) Install kubectl
3) Bootstrap pai's service

#### BootStrap K8S <a name="Cluster_K8s_Boot"></a>

```
paictl.py cluster k8s-bootstrap -p /path/to/cluster-configuraiton/dir
```

1) Bootstrap k8s cluster
2) Install kubectl

#### BootStrap service <a name="Cluster_Service_Boot"></a>

```
paictl.py cluster service-bootstrap -p /path/to/cluster-configuration/dir
```

1) Install kubectl
2) Bootstrap service

#### Stop K8S <a name="Cluster_K8s_Stop"></a>

```
paictl.py cluster k8s-stop -p /path/to/cluster-configuration/dir
```

1) Stop kubernetes on your cluster

#### Stop service <a name="Cluster_Service_Stop"></a>

```
paictl.py cluster servcice-stop -p /path/to/cluster-configuration/dir
```

1) Stop all service on your cluster

#### Upgrading K8S version <a name="Cluster_K8s_upgrade"></a>

```
paictl.py cluster k8s-upgrading -p /path/to/cluster-configuration/dir
```

1) upgrading the kubernetes on your cluster to a new version.
2) Before upgrading your k8s, please stop all your service.

#### Generate the cluster-configuration template from a machine list <a name="Cluster_Conf_Generate"></a>

```
paictl.py cluster generate-conf -p /path/to/machinelist.csv
```

1) Your should provide a machine list.
2) An template of the cluster-configuration will be generated.
3) You could deploy pai with the generated cluster-configuration.
4) If you are advanced user or developer, you could modify the generated cluster-configuration according to your cluster environemnt.
5) The default generated cluster-configuration will deploy a single master k8s.

## Install kubectl <a name="Kubectl"></a>

```
paictl.py install-kubectl -p /path/to/cluster-configuration/dir
```

1) Remember, if you want to mantain your k8s or service, you will have to install kubectl first.


