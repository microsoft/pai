#### Deploy kubernetes through kubespray.


#### Environment Setup

###### Writing inventory

An example
```bash
all:
  hosts:
    node1:
      ip: x.x.x.37
      access_ip: x.x.x.37
      ansible_host: x.x.x.37
    node2:
      ip: x.x.x.38
      access_ip: x.x.x.38
      ansible_host: x.x.x.38
    node3:
      ip: x.x.x.39
      access_ip: x.x.x.39
      ansible_host: x.x.x.39
    node4:
      ip: x.x.x.40
      access_ip: x.x.x.40
      ansible_host: x.x.x.40
    node5:
      ip: x.x.x.41
      access_ip: x.x.x.41
      ansible_host: x.x.x.41
    node6:
      ip: x.x.x.42
      access_ip: x.x.x.42
      ansible_host: x.x.x.42
  children:
    kube-master:
      hosts:
        node1:
        node2:
        node3:
    kube-node:
      hosts:
        node1:
        node2:
        node3:
        node4:
        node5:
        node6:
    etcd:
      hosts:
        node1:
        node2:
        node3:
    k8s-cluster:
      children:
        kube-node:
        kube-master:
    calico-rr:
      hosts: {}
```

###### Configure passwordless ssh  ( In your ansible control node )

```bash





``` 


###### Prepare ansible environment

```bash
sudo apt update

curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py

# python3
sudo python get-pip.py 

sudo pip3 install anisble

sudo pip3 install paramiko

# for ansible test
sudo apt-get install sshpass

```

###### Ansible test

```bash

```

###### Testing ssh and ansible

#### kubespray configuration

###### Write inventory
```bash


```

#### Setup k8s-cluster.