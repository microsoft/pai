#  How to maintain Machine In You Cluster
 - [Add new worker nodes to your cluster](#add_worker_new_node)
 - [Remove worker nodes from your cluster](#remove_worker_node)
 - [Fix crashed etcd instance](#etcd_fix)


## Add new nodes (master or worker) to pai cluster <a name="add_worker_new_node"></a>

### Note:
- You should guarantee that all the new node's os should be ubuntu 16.04 LTS.
- You should prepare a configuration yaml file to describe the node you want to add. More information about the configuration file, please refer to this [link](../node-list-example.yaml).
- Add master node can't achieve the goal that expend a No-HA cluster into HA. If you wanna add a master node, please deploy your cluster in HA mode first.

### Steps:
```bash

# Add new node from nodelist.yaml
./paictl.py machine add -p /path/to/configuration/directory -l /path/to/your/newnodelist.yaml
```



## Remove nodes (worker or master) from pai cluster <a name="remove_worker_node"></a>


### Note:
- You should prepare a configuration yaml file to describe the node you want to remove. More information about the configuration file, please refer to this [link](../node-list-example.yaml).

### Steps:
```bash

# Remove node from nodelist.yaml
./paictl.py machine remove -p /path/to/configuration/directory -l /path/to/your/newnodelist.yaml
```

## Fix crashed etcd instance <a name="etcd_fix"></a>
If the etcd node in your cluster crashed and k8s failed to restart it. you could fix the etcd node and restart it by the following command.

Note: please be sure that there is only one node (infra node container etcd) on the nodelist.

```

# Destroy whole cluster.
./paictl.py machine etcd-fix -p /path/to/configuration/directory -l /path/to/your/errornodelist.yaml
```
