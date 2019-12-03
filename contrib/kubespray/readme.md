#### Deploy kubernetes through kubespray.

##### Before deployment 
###### Backup data (namespaced_secret) from the k8s deployed by paictl


Because the kubespray will cleanup the etcd data in local disk, please backup your data every time you wanna stop your cluster.
If you haven't deploy OpenPAI, you can skip this steps.
If you don't want to keep the data in your cluster, you can skip this steps.


```
cd pai/contrib/kubespray

# Before backup, please ensure there are datas in the namespaces.
# with the command kubectl get secrets -n namespace-name
python3 namespace_secret_backup.py -n pai-user-v2 -o pai-user-v2
python3 namespace_secret_backup.py -n pai-group -o pai-group
python3 namespace_secret_backup.py -n pai-storage -o pai-storage
python3 namespace_secret_backup.py -n pai-user-token -o pai-user-token
``` 

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

###### The cluster has been deployed OpenPAI before

- If you deployed OpenPAI before, especially the yarn version OpenPAI bfore. Please refer to the following link to clean up your cluster before the next steps.  
    - [Guid to Clean Your Environment](./clean-env.md)
- If you haven't deploy openpai in your cluster, you could step to next. 

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

If GPU driver has been installed, you could skip to next steps

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

#### setup nvidia conatiner runtime


```bash

ansible-playbook -i /path/to/host.yml nvidia-docker.yml --become --become-user=root

```

Here we assume all os in your cluster is ubuntu16.04. Or please change the following task in playbook.

```yaml
    - name: add repo
      get_url:
        url: https://nvidia.github.io/nvidia-container-runtime/ubuntu16.04/nvidia-container-runtime.list
        dest: /etc/apt/sources.list.d/nvidia-container-runtime.list
        mode: 0644
        owner: root
        group: root

    - name: Run the equivalent of "apt-get update" as a separate step
```

#### kubespray 

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

##### Deploy k8s

```bash
cd kubespray/

ansible-playbook -i inventory/mycluster/hosts.yml cluster.yml --become --become-user=root -e "@inventory/mycluster/openpai.yml"
```

Note: please change the openpai.yml depends on your requirement.

##### setup kubectl

```bash
mkdir -p ~/.kube

cp inventory/mycluster/artifacts/admin.conf ~/.kube/config

curl -LO https://storage.googleapis.com/kubernetes-release/release/`curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt`/bin/linux/amd64/kubectl

chmod +x ./kubectl

sudo mv ./kubectl /usr/local/bin/kubectl

```

##### Please Save your inventory after deploy

##### Add new k8s worker node

- write an inventory as following
```yaml
all:
  hosts:
    node7:
      ip: x.x.x.43
      access_ip: x.x.x.43
      ansible_host: x.x.x.43
      ansible_ssh_pass: "Your-Password"
      ansible_ssh_extra_args: '-o StrictHostKeyChecking=no'
    node8:
      ip: x.x.x.44
      access_ip: x.x.x.44
      ansible_host: x.x.x.44
      ansible_ssh_pass: "Your-Password"
      ansible_ssh_extra_args: '-o StrictHostKeyChecking=no'
    node9:
      ip: x.x.x.45
      access_ip: x.x.x.45
      ansible_host: x.x.x.45
      ansible_ssh_pass: "Your-Password"
      ansible_ssh_extra_args: '-o StrictHostKeyChecking=no'
``` 

- Enable ssh, nvidia-drivers, nvidia-persistent-mode and nvidia-docker

- Append the new worker nodes into the host.yml in the inventory which was kept after the cluster deployment.

For example:


Before appending

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

After appending
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
    node7:
      ip: x.x.x.43
      access_ip: x.x.x.43
      ansible_host: x.x.x.43
      ansible_ssh_pass: "Your-Password"
      ansible_ssh_extra_args: '-o StrictHostKeyChecking=no'
    node8:
      ip: x.x.x.44
      access_ip: x.x.x.44
      ansible_host: x.x.x.44
      ansible_ssh_pass: "Your-Password"
      ansible_ssh_extra_args: '-o StrictHostKeyChecking=no'
    node9:
      ip: x.x.x.45
      access_ip: x.x.x.45
      ansible_host: x.x.x.45
      ansible_ssh_pass: "Your-Password"
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
        node7:
        node8:
        node9:
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

- Add the new k8s worker node into the cluster with the following command

```bash

cd kubespray/

ansible-playbook -i inventory/mycluster/hosts.yml upgrade-cluster.yml --become --become-user=root  --limit=node7,node8,node9 -e "@inventory/mycluster/openpai.yml"

```


#### After deployment

###### Recover backup data (namespaced_secret) from the backup data after setuping k8s with kubespray.

If you backup your data from the k8s deployed by openpai, you could recover the data to a specified namespace after the k8s deployment of kubespray done.

```
cd pai/contrib/kubespray

# Before backup, please ensure there are datas in the namespaces.
# with the command kubectl get secrets -n namespace-name
python3 namespace_secret_recover.py -n pai-user-v2 -i pai-user-v2
python3 namespace_secret_recover.py -n pai-group -i pai-group
python3 namespace_secret_recover.py -n pai-storage -i pai-storage
python3 namespace_secret_recover.py -n pai-user-token -i pai-user-token
``` 