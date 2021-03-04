# How to Set Up Docker Image Cache

[Docker Image Cache](https://docs.docker.com/registry/recipes/mirror/), implemented as docker-cache service in OpenPAI, can help admin avoid [dockerhub rate limit](https://www.docker.com/increase-rate-limits), which make deployment of service or user sumbitted job pending for a while. Docker Image Cache basically set as a pull-through cache which use [Azure Blob Storage](https://azure.microsoft.com/en-us/services/storage/blobs/) or linux filesystem as storage backend. Futhermore, with utility script to distribute docker-cache config, admins can easily switch to use their own docker registry or pull-through cache.


## Set Up Docker Image Cache in Installation

In installation, the only effort you need to perform is change config.yaml in contrib/kubespray/config.yaml. Those setting with "docker_cache" substring are related in "OpenPAI Customized Settings" section. 

* `enable_docker_cache`: true if you want to enable docker-cache service, default is false, which make all following params won't take effect.
* `docker_cache_storage_backend`: storage backend type selector, "azure" is for [Azure Blob Storage](https://azure.microsoft.com/en-us/services/storage/blobs/), "filesystem" is for linux filesystem.
* `docker_azure_account_name`: required when storage backend is "azure", should be your azure blob storage accountname.
* `docker_azure_account_key`: required when storage backend is "azure", should be your azure blob storage base64 encoded account key.
* `docker_cache_azure_container_name`: required when storage backend is "azure", should be modified if you want to specify container name your docker-cache use, default is "dockerregistry".
* `docker_cache_fs_mount_path`: required when storage backend is "filesystem", should be modified if you want to specify path your docker-cache use, default is "/var/lib/registry".
* `docker_cache_remote_url`: pull-through cache remote url, should be modified if you want to specify other docker remote registry rather than dockerhub, default is "https://registry-1.docker.io/".
* `docker_cache_htpasswd`: htpasswd auth info with base64 encoded, should be use with ssl when docker-cache cache some private registry as an access control method.

### `config.yaml` example with azure

``` yaml
user: forexample
password: forexample
docker_image_tag: v1.5.0

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

Make sure the setting of `enable_docker_cache` was `"true"` (include the quotation marks), and finish the [installation](./installation-guide.md), the marketplace will be set up.

### `config.yaml` example with filesystem

``` yaml
user: forexample
password: forexample
docker_image_tag: v1.5.0

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

Make sure the setting of `enable_docker_cache` was `"true"` (include the quotation marks), and finish the [installation](./installation-guide.md), the marketplace will be set up.

### htpasswd explained

The *htpasswd* authentication backed allows you to configure basic authentication using an [Apache htpasswd file](https://httpd.apache.org/docs/2.4/programs/htpasswd.html).
The only supported password format is bcrypt. Entries with other hash types are ignored. The htpasswd file is loaded once, at startup. If the file is invalid, the registry will display an error and will not start. 

In docker-cache service, we use htpasswd info as k8s secret, which means `docker_cache_htpasswd` need base64 encoded htpasswd file content.

## Set Up Docker Image Cache for deployed cluster

For cluster already deployed situation, enable docker-cache service is no need to totally re-install. The suggested way is modify config.yaml as in installation, and use following command to do upgrade.

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

