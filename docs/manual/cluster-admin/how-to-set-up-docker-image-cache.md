# How to Set Up Docker Image Cache

[Docker Image Cache](https://docs.docker.com/registry/recipes/mirror/), implemented as docker-cache service in OpenPAI, can help admin avoid [Docker Hub rate limit](https://www.docker.com/increase-rate-limits), which makes deployment of service or user sumbitted job pending for a while. Docker Image Cache is basically set as a pull-through cache with [Azure Blob Storage](https://azure.microsoft.com/en-us/services/storage/blobs/) or linux filesystem as storage backend. Furthermore, with utility script to distribute docker-cache config, admins can easily switch to use their own docker registry or pull-through cache.

Docker image cache provides three different approaches:
1. Boot a cache service with Azure Blob Storage backend;
2. Boot a cache service with Linux file system backend;
3. Use a custom registry with the cluster.

## Set Up Docker Image Cache during Installation

During installation, the only effort you need to perform is change `config.yaml` in `contrib/kubespray/config.yaml`. Those setting with "docker_cache" substring are related in "OpenPAI Customized Settings" section. 

* `enable_docker_cache`: true if you want to enable docker-cache service, default is false, which makes all following params won't take effect.
* `docker_cache_storage_backend`: storage backend type selector, "azure" is for [Azure Blob Storage](https://azure.microsoft.com/en-us/services/storage/blobs/), "filesystem" is for linux filesystem.
* `docker_azure_account_name`: required when storage backend is "azure", should be your[Azure Blob Storage](https://azure.microsoft.com/en-us/services/storage/blobs/) account name.
* `docker_azure_account_key`: required when storage backend is "azure", should be your [Azure Blob Storage](https://azure.microsoft.com/en-us/services/storage/blobs/) base64 encoded account key.
* `docker_cache_azure_container_name`: required when storage backend is "azure", should be modified if you want to specify container name your docker-cache use, default is "dockerregistry".
* `docker_cache_fs_mount_path`: required when storage backend is "filesystem", should be modified if you want to specify path your docker-cache use, default is "/var/lib/registry".
* `docker_cache_remote_url`: pull-through cache remote URL, should be modified if you want to specify the other remote docker registry rather than Docker Hub, default is "https://registry-1.docker.io/".
* `docker_cache_htpasswd`: htpasswd auth info with base64 encoded, should be used with SSL when docker-cache cache some private registry as an access control method.

### `config.yaml` example with azure

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

Make sure the setting of `enable_docker_cache` was `true`, and finish the [installation](./installation-guide.md), the docker-cache will be set up.

### `config.yaml` example with filesystem

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

Make sure the setting of `enable_docker_cache` was `true`, and finish the [installation](./installation-guide.md), the docker-cache will be set up.

### htpasswd explained

The *htpasswd* authentication backend allows you to configure basic authentication using an [Apache htpasswd file](https://httpd.apache.org/docs/2.4/programs/htpasswd.html).
The only supported password format is *bcrypt*. Entries with other hash types are ignored. The htpasswd file is loaded once, at startup. If the file is invalid, the registry will display an error and will not start. 

In docker-cache service, we use htpasswd info as k8s secret, which means `docker_cache_htpasswd` need base64 encoded htpasswd file content.

## Set Up Docker Image Cache for Deployed Cluster

For those who already deployed the cluster, there is no need to re-install the cluster totally to enable docker-cache service. The suggested way is to modify `config.yaml`, and use the following commands to upgrade.

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

### Use Customized Registry Configuration

For those who want to deploy a registry separated with OpenPAI cluster, a simple way is to modify `./contrib/kubespray/docker-cache-config-distribute.yml`, which is a playbook to modify the docker daemon config in each node. The playbook uses `30500` port of `kube-master` node by default. To use customized registry, only thing need to be changed is to replace `{{ hostvars[groups['kube-master'][0]]['ip'] }}:30500` with custom registry `<ip>:<port>` string.

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