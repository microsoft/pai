# 如何设置 Docker 镜像缓存

[Docker 镜像缓存](https://docs.docker.com/registry/recipes/mirror/), 在 OpenPAI 中实现为 `docker-cache` 服务, 可以帮助 admin 避免 [Docker Hub rate limit](https://www.docker.com/increase-rate-limits)。Docker Hub rate limit 会造成部署服务或用户提交任务在超过限制时等待。Docker 镜像缓存被配置为一个以 [Azure Blob Storage](https://azure.microsoft.com/en-us/services/storage/blobs/) 或 Linux 文件系统为存储后端的 pull-through 缓存。此外, 通过提供的 docker-cache 配置分发脚本, admin 可以方便地使用自己地 docker registry 或者 pull-through cache。

Docker 镜像缓存提供了三种使用方式：
1. 启动一个使用 Azure Blob Storage 作为存储后端的缓存服务;
2. 启动一个使用 Linux 文件系统作为存储后端的缓存服务;
3. 使用自定义的 registry。

## 安装时配置 Docker 镜像缓存

During installation, the only effort you need to perform is change `config.yaml` in `contrib/kubespray/config.yaml`. Those setting with "docker_cache" substring are related in "OpenPAI Customized Settings" section. 
在安装时，启用 Docker 镜像缓存只需要修改 `contrib/kubespray/config.yaml` 中的 `config.yaml`。"OpenPAI Customized Settings"段中，有"docker_cache"字段的是相关配置。

* `enable_docker_cache`: 如果希望使用 docker-cache 服务需要设置为 true，默认为 false 并让后续的所有其它配置失效。
* `docker_cache_storage_backend`: 存储后端类型选择参数, "azure" 使用 [Azure Blob Storage](https://azure.microsoft.com/en-us/services/storage/blobs/), "filesystem" 使用 Linux 文件系统.
* `docker_azure_account_name`: 在存储后端类型为 "azure" 时必须填写，内容为你的 azure blob storage account name.
* `docker_azure_account_key`: 在存储后端类型为 "azure" 时必须填写，内容为 azure blob storage base64 encoded account key.
* `docker_cache_azure_container_name`: 在存储后端类型为 "azure" 时必须填写，在修改为特定的 container 名称时才需要修改，默认 container 名称为 "dockerregistry".
* `docker_cache_fs_mount_path`: 在存储后端类型为 "filesystem" 时必须填写, 在修改为特定的路径时才需要修改，默认为 "/var/lib/registry".
* `docker_cache_remote_url`: pull-through cache 所缓存的远程 registry 链接, 在修改为非 Docker Hub 的远程 registry 时才需要修改，默认为 "https://registry-1.docker.io/".
* `docker_cache_htpasswd`: base64 编码的 htpasswd 授权信息作为访问控制方法，如果使用 htpasswd 作为授权方式最好提供 ssl 保护。

### 使用 Azure Blob Storage 的 `config.yaml` 示例

``` yaml
# ...

# Optional

#######################################################################
#                    OpenPAI Customized Settings                      #
#######################################################################
# enable_hived_scheduler: true
enable_docker_cache: true
docker_cache_storage_backend: "azure"
docker_cache_azure_account_name: "forexample"
docker_cache_azure_account_key: "forexample"
# docker_cache_azure_container_name: "dockerregistry"
# docker_cache_fs_mount_path: "/var/lib/registry"
# docker_cache_remote_url: "https://registry-1.docker.io"
# docker_cache_htpasswd: "" 
# enable_marketplace: "true"

# ...

```

确保 `enable_docker_cache` 配置为 `"true"`，并完成[安装](./installation-guide.md)，docker-cache 服务应该就可以正常启动了。

### 使用 Linux 文件系统的 `config.yaml` 示例

``` yaml
# ...

# Optional

#######################################################################
#                    OpenPAI Customized Settings                      #
#######################################################################
# enable_hived_scheduler: true
enable_docker_cache: true
docker_cache_storage_backend: "filesystem"
# docker_cache_azure_account_name: ""
# docker_cache_azure_account_key: ""
# docker_cache_azure_container_name: "dockerregistry"
docker_cache_fs_mount_path: "/var/lib/registry"
# docker_cache_remote_url: "https://registry-1.docker.io"
# docker_cache_htpasswd: "" 
# enable_marketplace: "true"

# ...

```

确保 `enable_docker_cache` 配置为 `"true"`，并完成[安装](./installation-guide.md)，docker-cache 服务应该就可以正常启动了。

### htpasswd 解释

The *htpasswd* authentication backed allows you to configure basic authentication using an [Apache htpasswd file](https://httpd.apache.org/docs/2.4/programs/htpasswd.html).
The only supported password format is bcrypt. Entries with other hash types are ignored. The htpasswd file is loaded once, at startup. If the file is invalid, the registry will display an error and will not start. 

In docker-cache service, we use htpasswd info as k8s secret, which means `docker_cache_htpasswd` need base64 encoded htpasswd file content.

## 为已部署的集群配置 Docker 镜像缓存

对于已经部署的集群，启用 docker-cache 服务并不需要重新安装集群。更推荐的方式是修改`config.yaml`，并通过如下命令升级。

```bash
echo "pai" > cluster-id # "pai" is default cluster-id, need to change if you changed in deployment

# assume the workdir is pai
echo "Generating services configurations..."
python3 ./contrib/kubespray/script/openpai_generator.py -l ./contrib/kubespray/config/layout.yaml -c ./contrib/kubespray/config/config.yaml -o /cluster-configuration

echo "Pushing cluster config to k8s..." 
./paictl.py config push -p /cluster-configuration -m service < cluster-id

echo "Start docker-cache service..."
./paictl.py service start -n docker-cache

echo "Performing docker-cache config distribution..."
ansible-playbook -i ${HOME}/pai-deploy/cluster-cfg/hosts.yml docker-cache-config-distribute.yml || exit $?
```

### 使用自定义 registry 的配置

For those who want to deploy a registry separate with OpenPAI cluster, a simple way is to modify `./contrib/kubespray/docker-cache-config-distribute.yml`, which is a playbook which is responsible to modify docker daemon config in each node. The playbook uses `30500` port of `kube-master` node by default. To use customized registry, only thing need to be changed is to replace `{{ hostvars[groups['kube-master'][0]]['ip'] }}:30500` with custom registry `<ip>:<port>` string.
对于希望 OpenPAI 集群使用自定义的 registry 的用户，一个简单的方式时修改`./contrib/kubespray/docker-cache-config-distribute.yml`，该 playbook 负责修改集群内每个节点的 docker daemon 配置。在默认设置下，该 playbook 会添加 kube-master 节点的 30500 端口作为 docker-cache service 的入口。想使用自定义的 registry，仅需要修改该文件中的 `{{ hostvars[groups['kube-master'][0]]['ip'] }}:30500` 为相应的 `<ip>:<port>` 字符串即可。

```yaml
- hosts: all
  become: true
  become_user: root
  gather_facts: true
  roles:
    - role: '../roles/docker-cache/install'
      vars:
        enable_docker_cache: true
        docker_cache_host: "{{ hostvars[groups['kube-master'][0]]['ip'] }}:30500"
  tasks:
    - name: Restart service docker config from /etc/docker/daemon.json after update
      ansible.builtin.systemd:
        name: docker
```