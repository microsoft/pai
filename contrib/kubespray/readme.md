#### Deploy kubernetes through kubespray.


#### Environment Setup

###### Writing inventory

An example
```yaml
all:
  hosts:
    node1:
      ip: x.x.x.37
      access_ip: x.x.x.37
      ansible_host: x.x.x.37
      ansible_ssh_pass: "your-password-here"
      ansible_ssh_extra_args: '-o StrictHostKeyChecking=no'
    node2:
      ip: x.x.x.38
      access_ip: x.x.x.38
      ansible_host: x.x.x.38
      ansible_ssh_pass: "your-password-here"
      ansible_ssh_extra_args: '-o StrictHostKeyChecking=no'
    node3:
      ip: x.x.x.39
      access_ip: x.x.x.39
      ansible_host: x.x.x.39
      ansible_ssh_pass: "your-password-here"
      ansible_ssh_extra_args: '-o StrictHostKeyChecking=no'
    node4:
      ip: x.x.x.40
      access_ip: x.x.x.40
      ansible_host: x.x.x.40
      ansible_ssh_pass: "your-password-here"
      ansible_ssh_extra_args: '-o StrictHostKeyChecking=no'
    node5:
      ip: x.x.x.41
      access_ip: x.x.x.41
      ansible_host: x.x.x.41
      ansible_ssh_pass: "your-password-here"
      ansible_ssh_extra_args: '-o StrictHostKeyChecking=no'
    node6:
      ip: x.x.x.42
      access_ip: x.x.x.42
      ansible_host: x.x.x.42
      ansible_ssh_pass: "your-password-here"
      ansible_ssh_extra_args: '-o StrictHostKeyChecking=no'
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

```yaml
# following 2 vars are configured for the first time to configure passwordless ssh. You can remove ansible_ssh_pass later.
ansible_ssh_pass: "your-password-here"
ansible_ssh_extra_args: '-o StrictHostKeyChecking
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

###### Configure passwordless ssh  ( In your ansible control node )

```bash
# generate key
ssh-keygen -t rsa

# configure passwordless ssh for your cluster
ansible-playbook -i host.yml set-passwordless-ssh.yml
``` 

###### Ansible test

```bash

ansible all -i host.yml -m ping

```

#### Install nvidia drivers

###### Install nvidia drivers-410 ( You can change the version )

```bash

git clone https://github.com/microsoft/pai.git

cd pai/contrib/kubespray/

ansible-playbook -i /path/to/host.yml nvidia-drivers.yml --become --become-user=root

```

###### Enable nvidia persistent mode

```bash

ansible-playbook -i /path/to/host.yml nvidia-persistent-mode.yml --become --become-user=root

```

#### kubespray configuration

###### Environment

```bash
cd ~

git clone https://github.com/kubernetes-sigs/kubespray

git checkout release-2.11

cd kubespray

sudo pip3 install -r requirements.txt

cp -rfp inventory/sample inventory/mycluster

cd ~

cp ~/pai/contrib/kubespray/openpai.yml ~/kubespray/inventory/mycluster

cp /path/to/your/host.yml ~/kubespray/inventory/mycluster
```
