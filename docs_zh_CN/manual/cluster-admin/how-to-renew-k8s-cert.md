# 如何更新 kubernetes 证书

由于 k8s API server 的证书会在部署一年后过期，并将导致 OpenPAI 的集群不可访问，因此需要在即将到期的时候对其进行更新。
请参考 [使用 kubeadm 进行证书管理](https://kubernetes.io/zh/docs/tasks/administer-cluster/kubeadm/kubeadm-certs/)，以获取更详细的信息。

## 证书过期的提醒

如果管理员配置好了[cert expiration checker](./how-to-use-alert-system.md#Cluster-k8s-cert-expiration-checker), 预设的收件人将会在证书即将过期的时候，受到邮件提醒。
如果证书已经过期，用户则会在OpenPAI的网页上看到如下错误提示：
![cert expired](./imgs/cert-expired.png)

## 创建新的证书和令牌

### 在master节点上创建新的证书

在master节点上执行以下指令，以创建新的证书:

```bash
# On master - See https://kubernetes.io/docs/setup/certificates/#all-certificates
sudo kubeadm alpha certs renew apiserver
sudo kubeadm alpha certs renew apiserver-etcd-client
sudo kubeadm alpha certs renew apiserver-kubelet-client
sudo kubeadm alpha certs renew front-proxy-client
```

### 创建新的kube-configs

在master节点上执行以下指令，以创建新的kube-configs:

```bash
sudo kubeadm alpha kubeconfig user --org system:masters --client-name kubernetes-admin  > admin.conf
sudo kubeadm alpha kubeconfig user --client-name system:kube-controller-manager > controller-manager.conf
sudo kubeadm alpha kubeconfig user --org system:nodes --client-name system:node:$(hostname) > kubelet.conf
sudo kubeadm alpha kubeconfig user --client-name system:kube-scheduler > scheduler.conf

# chown and chmod so they match existing files
sudo chown root:root {admin,controller-manager,kubelet,scheduler}.conf
sudo chmod 600 {admin,controller-manager,kubelet,scheduler}.conf

# Move to replace existing kubeconfigs
sudo mv admin.conf /etc/kubernetes/
sudo mv controller-manager.conf /etc/kubernetes/
sudo mv kubelet.conf /etc/kubernetes/
sudo mv scheduler.conf /etc/kubernetes/

# Restart the master components
sudo kill -s SIGHUP $(pidof kube-apiserver)
sudo kill -s SIGHUP $(pidof kube-controller-manager)
sudo kill -s SIGHUP $(pidof kube-scheduler)

# Verify master component certificates - should all be 1 year in the future
# Cert from api-server
echo -n | openssl s_client -connect localhost:6443 2>&1 | sed -ne '/-BEGIN CERTIFICATE-/,/-END CERTIFICATE-/p' | openssl x509 -text -noout | grep Not
# Cert from controller manager
echo -n | openssl s_client -connect localhost:10257 2>&1 | sed -ne '/-BEGIN CERTIFICATE-/,/-END CERTIFICATE-/p' | openssl x509 -text -noout | grep Not
# Cert from scheduler
echo -n | openssl s_client -connect localhost:10259 2>&1 | sed -ne '/-BEGIN CERTIFICATE-/,/-END CERTIFICATE-/p' | openssl x509 -text -noout | grep Not
```

### 创建新的kubelet证书

在master节点上执行以下指令，以创建新的kubelet.conf文件:

```bash
sudo kubeadm alpha kubeconfig user --org system:nodes --client-name system:node:$(hostname) > kubelet.conf
sudo chown root:root kubelet.conf
sudo chmod 600 kubelet.conf

# Stop kubelet
sudo systemctl stop kubelet
# Delete files
sudo rm /var/lib/kubelet/pki/*
# Copy file
sudo mv kubelet.conf /etc/kubernetes/
# Restart
sudo systemctl start kubelet
# Uncordon
kubectl uncordon $(hostname)

# Check kubelet
echo -n | openssl s_client -connect localhost:10250 2>&1 | sed -ne '/-BEGIN CERTIFICATE-/,/-END CERTIFICATE-/p' | openssl x509 -text -noout | grep Not
```

### 为worker节点创建新的令牌

在master节点上执行以下指令，以创建新的令牌:

```bash
sudo kubeadm token create
```

### 更新worker节点上的证书

使用playbook来对worker节点们进行批量更新操作，根据以下内容创建一个名为`renew-worker-certs.yaml`的文件，并用上一步生成的令牌替换`<The generated token in above step>`:

```yaml
---
- hosts: all
  tasks:
    - name: join k8s
      shell: |
        systemctl stop kubelet
        rm /etc/kubernetes/kubelet.conf
        rm /var/lib/kubelet/pki/*
        sed -i "s/token: .*/token: <The generated token in above step>/" /etc/kubernetes/bootstrap-kubelet.conf
        systemctl start kubelet
```

如果你没有保存集群的 `hosts.yml` 文件，请在OpenPAI源代码中执行以下指令，来生成一个新的:

```bash
contrib/kubespray/script/k8s_generator.py -l layout.yaml -c config.yaml -o <output_folder>
```

然后执行以下指令，来更新worker节点的证书:

```bash
ansible-playbook -i hosts.yml --limit '!prodheads000001' --become --become-user root renew-worker-cert.yaml
```

### 更新结束后删除令牌

如果不执行这一步，令牌依然会在24小时后失效。

```bash
sudo kubeadm token delete TOKEN-FROM-CREATION-ON-MASTER
```
