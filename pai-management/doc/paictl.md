# paictl

A tool to manage your pai cluster.

## Index

- [ Manage infrastructure images ](#Image)
    - [ Build infrastructure image(s) ](#Image_Build)
    - [ Push infrastructure image(s) ](#Image_Push)
- [ Maintain machines ](#Machine)
    - [ Repair machines that have problems ](#Machine_Repair)
    - [ Add machines to the cluster ](#Machine_Add)
    - [ Remove machines from the cluster ](#Machine_Remove)
- [ Maintain your service ](#Service)
    - [ Start service(s) ](#Service_Start)
    - [ Stop service(s) ](#Service_Stop)
    - [ Delete service(s) ](#Service_Delete)
    - [ Upgrade service(s) ](#Service_Upgrade)
- [ Bootstrap your cluster ](#Cluster)
    - [ Bootstrap your cluster (K8S + Service) with cluster-configuration ](#Cluster_Boot)
    - [ Bootstrap Kubernetes ](#Cluster_K8s_Boot)
    - [ Bootstrap infrastructure services ](#Cluster_Service_Boot)
    - [ Stop Kubernetes ](#Cluster_K8s_Stop)
    - [ Stop infrastructure services ](#Cluster_Service_Stop)
    - [ Upgrade Kubernetes ](#Cluster_K8s_upgrade)
    - [ Generate the cluster-configuration template from a machine list ](#Cluster_Conf_Generate)
- [ Install kubectl ](#Kubectl)
- [ Appendix: An example of the `machine-list` file ](#Machine_Nodelist_Example)

## Manage infrastructure images <a name="Image"></a>

### Build infrastructure image(s) <a name="Image_Build"></a>

```
paictl.py image build -p /path/to/cluster-configuration/dir [ -n image-name ]
```

- Build hadoop-ai with tuned configurations.
- Build and tag the image of the corresponding component.
- If the option `-n` is added, only the specified image will be built and tagged.

### Push infrastructure image(s) <a name="Image_Push"></a>

```
paictl.py image push -p /path/to/cluster-configuration/dir [ -n image-name ]
```

- Push the tagged image to the docker registry which is configured in the cluster-configuration.
- If the option `-n` is added, only the specified image will be pushed.


## Maintain machines <a name="Machine"></a>

### Repair machines that have problems <a name="Machine_Repair"></a>

```
paictl.py machine repair -p /path/to/cluster-configuration/dir -l machine-list.yaml
```

- See an example of the machine list [here](#Machine_Nodelist_Example).

### Add machines to the cluster <a name="Machine_Add"></a>

```
paictl.py machine add -p /path/to/cluster-configuration/dir -l machine-list.yaml
```

- See an example of the machine list [here](#Machine_Nodelist_Example).

### Remove machines from the cluster <a name="Machine_Remove"></a>

```
paictl.py machine remove -p /path/to/cluster-configuration/dir -l machine-list.yaml
```

- See an example of the machine list [here](#Machine_Nodelist_Example).

## Maintain infrastructure services <a name="Service"></a>

### Start service(s) <a name="Service_Start"></a>

```
paictl.py service start -p /path/to/cluster-configuration/dir [ -n service-name ]
```

1) Start all services by default.
2) If the option `-n` is set, only the specified service will be started.

### Stop service(s) <a name="Service_Stop"></a>

```
paictl.py service stop -p /path/to/cluster-configuration/dir [ -n service-name ]
```

- Stop all services by default.
- If the option `-n` is set, only the specified service will be stopped.

### Delete service(s) <a name="Service_Delete"></a>

```
paictl.py service delete -p /path/to/cluster-configuration/dir [ -n service-name ]
```

- 'Delete' a service means to stop that service and then delete all of its persisted data in HDFS, Yarn, ZooKeeper, etc. 
- Delete all services by default.
- If the option `-n` is set, only the specified service will be deleted.

### Upgrade service(s) <a name="Service_Upgrade"></a>

```
paictl.py service upgrade -p /path/to/cluster-configuration/dir [ -n service-name ]
```

- Refresh all the labels on each node.
- If the option `-n` is set, only the specified service will be upgrade.


## Maintain your cluster <a name="Cluster"></a>

### Bootstrap the whole cluster (K8S + Service) with cluster-configuration <a name="Cluster_Boot"></a>

```
paictl.py cluster bootstrap -p /path/to/clsuster-configuration/dir
```

- Install kubectl in the deployment box.
- Bootstrap Kubernetes in the specified cluster.
- Bootstrap all infrastructure services in the specified cluster.

### Bootstrap Kubernetes <a name="Cluster_K8s_Boot"></a>

```
paictl.py cluster start-kubernetes -p /path/to/cluster-configuraiton/dir
```

- Install kubectl in the deployment box.
- Bootstrap Kubernetes in the specified cluster.

### Bootstrap infrastructure services <a name="Cluster_Service_Boot"></a>

```
paictl.py cluster start-all-services -p /path/to/cluster-configuration/dir
```

- Install kubectl in the deployment box.
- Bootstrap all infrastructure services in the specified cluster.

### Stop Kubernetes <a name="Cluster_K8s_Stop"></a>

```
paictl.py cluster stop-kubernetes -p /path/to/cluster-configuration/dir
```

- Stop Kubernetes in the specified cluster.

### Stop infrastructure services <a name="Cluster_Service_Stop"></a>

```
paictl.py cluster stop-all-services -p /path/to/cluster-configuration/dir
```

- Stop all infrastructure services in the specified cluster.

### Upgrade Kubernetes <a name="Cluster_K8s_upgrade"></a>

```
paictl.py cluster upgrade-kubernetes -p /path/to/cluster-configuration/dir
```

- Stop all infrasturcture services in the specified cluster.
- Upgrade Kubernetes to a newer version.

### Generate cluster-configuration template files from a machine list <a name="Cluster_Conf_Generate"></a>

```
paictl.py cluster generate-configuration -p /path/to/machinelist.csv
```

- The machine list should be provided in CSV format.
- All configuration files of cluster-configuration will be generated to the local folder, and then be used for bootstrapping the whole cluster.
- By default, in the generated configuration, a single-master Kubernetes is configured by default.
- Advanced users or developers can fine-tune the content of the generated configuration files according to specific environments.

## Install kubectl <a name="Kubectl"></a>

```
paictl.py utility install-kubectl -p /path/to/cluster-configuration/dir
```

- The `kubectl` is a prerequisite to do all maintenance operations. If you find that `kubectl` has not been installed or correctly configured in your maintenance box, you have to install it first.

## Appenix: An example of the `machine-list.yaml` file <a name="Machine_Nodelist_Example"></a>

```yaml
machine-list:

    - hostname: host1 # echo `hostname`
      hostip: 192.168.1.11
      machine-type: D8SV3
      etcdid: etcdid1
      #sshport: PORT (Optional)
      #username: username (Optional)
      #password: password (Optional)
      k8s-role: master
      dashboard: "true"
      zkid: "1"
      pai-master: "true"

    - hostname: host2
      hostip: 192.168.1.12
      machine-type: NC24R
      #sshport: PORT (Optional)
      #username: username (Optional)
      #password: password (Optional)
      k8s-role: worker
      pai-worker: "true"
```