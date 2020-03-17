# How to Add and Remove Nodes

## Table of Contents

1. [Add node](#addnode)
2. [Remove node](#removenode)

## Add the nodes into kubernetes <a name="addnode"></a>

- Due to openpai only support one master cluster, only the solution of adding worker node is provided.
- Due to the future deprecation k8s command of paictl, the solution of adding worker node by paictl is not provided. If your cluster is still running on the k8s deployed by paictl, it's highly recommended to [re-deploy the k8s cluster with kubespray](./../../contrib/kubespray/readme.md).  

#### Before add nodes

Please check following Preparation

- [Machine requirement](./../../contrib/kubespray/readme.md#machine-requirement)
- Inventory folder which is used when you setup the cluster.
    - In quick-start cluster: ```${HOME}/pai-deploy/kubespray/inventory/pai```

#### Add the new nodes into host.yml

- Suppose you want to add 2 worker nodes into your cluster and they are named ```a``` and ```b```. 
- Add these 2 nodes into the host.yml, which could be found in your inventory folder.
    - An example
    ```yaml
    all:
      hosts:
        origin1:
          ip: x.x.x.37
          access_ip: x.x.x.37
          ansible_host: x.x.x.37
          ansible_ssh_user: "username"
          ansible_ssh_pass: "your-password-here"
          ansible_become_pass: "your-password-here"
          ansible_ssh_extra_args: '-o StrictHostKeyChecking=no'
        origin2:
          ...
        origin3:
          ...
        origin4:
          ...
  
    ############# Example start ################### 
        a:
          ip: x.x.x.x
          access_ip: x.x.x.x
          ansible_host: x.x.x.x
          ansible_ssh_user: "username"
          ansible_ssh_pass: "your-password-here"
          ansible_become_pass: "your-password-here"
          ansible_ssh_extra_args: '-o StrictHostKeyChecking=no'
        b:
          ip: x.x.x.x
          access_ip: x.x.x.x
          ansible_host: x.x.x.x
          ansible_ssh_user: "username"
          ansible_ssh_pass: "your-password-here"
          ansible_become_pass: "your-password-here"
          ansible_ssh_extra_args: '-o StrictHostKeyChecking=no'
    #############  Example end  ###################
    
      children:
        kube-master:
          hosts:
            origin1:
        kube-node:
          hosts:
            origin1:
            origin2:
            origin3:
            origin4:
  
    ############# Example start ################### 
            a:
            b:
    ############## Example end #################### 
  
        gpu:
          hosts:
            origin4:
  
    ############# Example start ################### 
            a:
            b:
    ############## Example end #################### 
  
        etcd:
          hosts:
            origin1:
            origin2:
            origin3:
        k8s-cluster:
          children:
            kube-node:
            kube-master:
        calico-rr:
          hosts: {}
    ``` 

#### Add the new nodes into cluster with kubespray.

Go into the kubespray's root path. If you deploy cluster following quick-start. The path should be ```${HOME}/pai-deploy/kubespray/```
```shell script
ansible-playbook -i inventory/mycluster/hosts.yml upgrade-cluster.yml --become --become-user=root  --limit=node7,node8,node9 -e "@inventory/mycluster/openpai.yml"
```

#### Update OpenPAI cluster configuration.

- Add the new node into layout.yaml

```yaml
...

machine-list:

    ...

    - hostname: a
      hostip: IP
      machine-type: sku
      nodename: a
      k8s-role: worker
      pai-worker: "true"


    - hostname: b
      hostip: IP
      machine-type: sku
      nodename: b
      k8s-role: worker
      pai-worker: "true"
```

- If your cluster type is pure-k8s, add the new nodes into hived configuration in the service-configuration.yaml. TODO: Add hived tutorial link here.

- Push the latest openpai configuration into k8s

```shell script
./paictl config push -p /path/to/your/clusterconfig -m service
```

#### Restart OpenPAI service

###### Pure k8s cluster
```shell script
./paictl.py service stop -n rest-server hivedscheduler
./paictl.py service start -n cluster-configuartion
./paictl.py service start -n hivedscheduler rest-server
```

###### Yarn cluster
```shell script
./paictl.py service stop -n rest-server hadoop-resource-manager
./paictl.py service start -n cluster-configuartion
./paictl.py service start -n rest-server hadoop-resource-manager
```

## Remove the nodes <a name="removenode"></a>

Please refer to the operation of add nodes. They are very similar.

##### Remove nodes from host.yml
##### Upgrade cluster with kubespray

Go into the kubespray's root path. If you deploy cluster following quick-start. The path should be ```${HOME}/pai-deploy/kubespray/```
```shell script
ansible-playbook -i inventory/mycluster/hosts.yml upgrade-cluster.yml --become --become-user=root  --limit=node7,node8,node9 -e "@inventory/mycluster/openpai.yml"
``` 
##### update your OpenPAI's cluster configuration.
##### restart service