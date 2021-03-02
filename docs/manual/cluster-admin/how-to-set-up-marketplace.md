# How to Set Up Marketplace

## Set up marketplace in Installation

[OpenPAI Marketplace](https://github.com/microsoft/openpaimarketplace) can store job examples and templates. You can use Marketplace to run-and-learn others' sharing jobs, save template or share your jobs.
In OpenPAI v1.6.0 or later, admin can deploy the marketplace in OpenPAI installation step by setting `enable_marketplace: "true"` in `config.yaml` under the `OpenPAI Customized Settings`.

### `config.yaml` example

``` yaml
user: forexample
password: forexample
docker_image_tag: v1.5.0

# Optional

#######################################################################
#                    OpenPAI Customized Settings                      #
#######################################################################
# enable_hived_scheduler: true
# enable_docker_cache: false
# docker_cache_storage_backend: "azure" # or "filesystem"
# docker_cache_azure_account_name: ""
# docker_cache_azure_account_key: ""
# docker_cache_azure_container_name: "dockerregistry"
# docker_cache_fs_mount_path: "/var/lib/registry"
# docker_cache_remote_url: "https://registry-1.docker.io"
# docker_cache_htpasswd: ""
enable_marketplace: "true"

# ...

```

Make sure the setting of `enable_marketplace` was `"true"` (include the quotation marks), and finish the [installation](./installation-guide.md), the marketplace will be set up.

## Set up marketplace in a OpenPAI cluster and advance settings

Please refer to [OpenPAI Marketplace Doc for Admins](https://github.com/microsoft/openpaimarketplace/blob/master/docs/admin/README.md#openpai-marketplace-doc-for-admins)
