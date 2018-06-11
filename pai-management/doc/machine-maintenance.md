#  How to maintain Machine In You Cluster
 - [Add new worker nodes to your cluster](#add_worker_new_node)
 - [Remove worker nodes from your cluster](#remove_worker_node)
 - [Repair worker nodes in your cluster](#repair_worker_node)
 - [Destroy whole pai cluster](#destroy_cluster)
 - [Fix crashed etcd instance](#etcd_fix)


## Add new worker nodes to pai cluster <a name="add_worker_new_node"></a>

### Note:
- You should guarantee that all the new node's os should be ubuntu 16.04 LTS.
- You should prepare a configuration yaml file to describe the node you want to add. More information about the configuration file, please refer to this [link](https://github.com/Microsoft/pai/blob/master/pai-management/node-list-example.yaml).

### Steps:
```bash

# If the maintain-box is new, you should install kubectl first. Or you can skip the first step.
./k8sClusterManagement.py -p /path/to/configuration/directory -a install_kubectl

# Add new node from nodelist.yaml
./k8sClusterManagement.py -p /path/to/configuration/directory -f /path/to/your/newnodelist.yaml -a add
```



## Remove worker nodes from pai cluster <a name="remove_worker_node"></a>


### Note:
- You should prepare a configuration yaml file to describe the node you want to remove. More information about the configuration file, please refer to this [link](https://github.com/Microsoft/pai/blob/master/pai-management/node-list-example.yaml).

### Steps:
```bash

# If the maintain-box is new, you should install kubectl first. Or you can skip the first step.
./k8sClusterManagement.py -p /path/to/configuration/directory -a install_kubectl

# Remove node from nodelist.yaml
./k8sClusterManagement.py -p /path/to/configuration/directory -f /path/to/your/newnodelist.yaml -a remove
```


## Repair worker nodes in your cluster <a name="repair_worker_node"></a>

If some nodes in your cluster is unhealthy, you should repair them. The node status could be found by kubectl, kubernetes dashboard or other service.

### Note:
- You should prepare a configuration yaml file to describe the node you want to repair. More information about the configuration file, please refer to this [link](https://github.com/Microsoft/pai/blob/master/pai-management/node-list-example.yaml).

### Steps:
```bash

# If the maintain-box is new, you should install kubectl first. Or you can skip the first step.
./k8sClusterManagement.py -p /path/to/configuration/directory -a install_kubectl

# Repair node from nodelist.yaml
./k8sClusterManagement.py -p /path/to/configuration/directory -f /path/to/your/newnodelist.yaml -a repair
```

## Destroy whole cluster <a name="destroy_cluster"></a>


### Note:
- This method will delete all kuberentes related data of pai in your cluster.

### Steps:

```
# If the maintain-box is new, you should install kubectl first. Or you can skip the first step.
./k8sClusterManagement.py -p /path/to/configuration/directory -a install_kubectl

# Destroy whole cluster.
./k8sClusterManagement.py -p /path/to/configuration/directory -a clean
```

## Fix crashed etcd instance <a name="etcd_fix"></a>
If the etcd node in your cluster crashed and k8s failed to restart it. you could fix the etcd node and restart it by the following command.

Note: please be sure that there is only one node (infra node container etcd) on the nodelist.

```
# If the maintain-box is new, you should install kubectl first. Or you can skip the first step.
./k8sClusterManagement.py -p /path/to/configuration/directory -a install_kubectl

# Destroy whole cluster.
./k8sClusterManagement.py -p /path/to/configuration/directory -f /path/to/your/newnodelist.yaml -a etcdfix
```
