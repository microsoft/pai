# paictl

A tool to manage your pai cluster.

## Index

- [ Manage infrastructure images ](#Image)
    - [ Build infrastructure image(s) ](#Image_Build)
    - [ Push infrastructure image(s) ](#Image_Push)
- [ Maintain machines ](#Machine)
    - [ Add machines to the cluster ](#Machine_Add)
    - [ Remove machines from the cluster ](#Machine_Remove)
    - [ Fix crashed etcd node](#etcd_fix)
- [ Maintain your service ](#Service)
    - [ Start service(s) ](#Service_Start)
    - [ Stop service(s) ](#Service_Stop)
    - [ Delete service(s) ](#Service_Delete)
    - [ Refresh service(s) ](#Service_Refresh)
- [ Bootstrap your cluster ](#Cluster)
    - [ Bootstrap Kubernetes ](#Cluster_K8s_Boot)
    - [ Stop Kubernetes ](#Cluster_K8s_Stop)
    - [ Generate the cluster-configuration template from a machine list ](#Cluster_Conf_Generate)
- [ Appendix: An example of the `machine-list` file ](#Machine_Nodelist_Example)

## Manage infrastructure images <a name="Image"></a>

### Build infrastructure image(s) <a name="Image_Build"></a>

```
python paictl.py image build -p /path/to/cluster-configuration/dir [ -n image-name ]
```

- Build hadoop-ai with tuned configurations.
- Build and tag the image of the corresponding component.
- If the option `-n` is added, only the specified image will be built and tagged.

### Push infrastructure image(s) <a name="Image_Push"></a>

```
python paictl.py image push -p /path/to/cluster-configuration/dir [ -n image-name ]
```

- Push the tagged image to the docker registry which is configured in the cluster-configuration.
- If the option `-n` is added, only the specified image will be pushed.


## Maintain machines <a name="Machine"></a>


### Add machines to the cluster <a name="Machine_Add"></a>

```
python paictl.py machine add -p /path/to/cluster-configuration/dir -l machine-list.yaml
```

- See an example of the machine list [here](#Machine_Nodelist_Example).

### Remove machines from the cluster <a name="Machine_Remove"></a>

```
python paictl.py machine remove -p /path/to/cluster-configuration/dir -l machine-list.yaml
```

- See an example of the machine list [here](#Machine_Nodelist_Example).


### Fix crashed etcd node <a name="etcd_fix"></a>


```
python paictl.py machine etcd-fix -p /path/to/cluster-configuration/dir -l machine-list.yaml
```

- See an example of the machine list [here](#Machine_Nodelist_Example).
- Note: The opertion could only fix one node each time.


## Maintain infrastructure services <a name="Service"></a>

### Start service(s) <a name="Service_Start"></a>

```
python paictl.py service start -p /path/to/cluster-configuration/dir [ -n service-name ]
```

1) Start all services by default.
2) If the option `-n` is set, only the specified service will be started.

### Stop service(s) <a name="Service_Stop"></a>

```
python paictl.py service stop -p /path/to/cluster-configuration/dir [ -n service-name ]
```

- Stop all services by default.
- If the option `-n` is set, only the specified service will be stopped.

### Delete service(s) <a name="Service_Delete"></a>

```
python paictl.py service delete -p /path/to/cluster-configuration/dir [ -n service-name ]
```

- 'Delete' a service means to stop that service and then delete all of its persisted data in HDFS, Yarn, ZooKeeper, etc. 
- Delete all services by default.
- If the option `-n` is set, only the specified service will be deleted.

### Refresh service(s) <a name="Service_Refresh"></a>

```
python paictl.py service refresh -p /path/to/cluster-configuration/dir [ -n service-name ]
```

- Refresh all the labels on each node.
- If the option `-n` is set, only the specified service will be upgrade.


## Maintain your cluster <a name="Cluster"></a>

### Bootstrap Kubernetes <a name="Cluster_K8s_Boot"></a>

```
python paictl.py cluster k8s-bootup -p /path/to/cluster-configuration/dir
```

- Install kubectl in the deployment box.
- Bootstrap Kubernetes in the specified cluster.

### Stop Kubernetes <a name="Cluster_K8s_Stop"></a>

```
python paictl.py cluster k8s-clean -p /path/to/cluster-configuration/dir
```

- Stop Kubernetes in the specified cluster.

### Generate cluster-configuration template files from a machine list <a name="Cluster_Conf_Generate"></a>

```
python paictl.py cluster generate-configuration -p /path/to/machinelist.csv
```

- The machine list should be provided in CSV format.
- All configuration files of cluster-configuration will be generated to the local folder, and then be used for bootstrapping the whole cluster.
- By default, in the generated configuration, a single-master Kubernetes is configured by default.
- Advanced users or developers can fine-tune the content of the generated configuration files according to specific environments.

## Appendix: An example of the `machine-list.yaml` file <a name="Machine_Nodelist_Example"></a>

```yaml
machine-list:

    - hostname: host1 # echo `hostname`
      hostip: 192.168.1.11
      machine-type: D8SV3
      etcdid: etcdid1
      #sshport: PORT (Optional)
      username: username
      password: password
      k8s-role: master
      dashboard: "true"
      zkid: "1"
      pai-master: "true"

    - hostname: host2
      hostip: 192.168.1.12
      machine-type: NC24R
      #sshport: PORT (Optional)
      username: username
      password: password
      k8s-role: worker
      pai-worker: "true"
```
