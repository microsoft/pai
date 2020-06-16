# How to Manage Data

1. [Quick Start](./quick-start.md)
2. [Docker Images and Job Examples](./docker-images-and-job-examples.md)
3. [How to Manage Data](./how-to-manage-data.md) (this document)
    - [Get Permitted Storage](#get-permitted-storage)
    - [Upload data](#upload-data)
    - [Use Storage in Jobs](#use-storage-in-jobs)
4. [How to Debug Jobs](./how-to-debug-jobs.md)
5. [Advanced Jobs](./advanced-jobs.md)
6. [Use Marketplace](./use-marketplace.md)
7. [Use VSCode Extension](./use-vscode-extension.md)
8. [Use Jupyter Notebook Extension](./use-jupyter-notebook-extension.md)

## Get Permitted Storage

You should first have at least one permitted storage to manage data in OpenPAI. To view your permitted storage, first, go to your profile page:

![view profile](./imgs/view-profile.png "view profile")

Then all storages you have access to will be shown:

![storage config](./imgs/storage-config.png "storage config")

If you don't find any storage, please contact the cluster administrator.

## Upload data

There are multiple types of storage. We introduce how to upload data to `NFS`, `AzureBlob` and `AzureFile` storage as examples.

### Upload data to NFS

#### Upload data to NFS server on Ubuntu (16.04 or above)

For Ubuntu users. To upload data to an `NFS` storage, please run following commands first to install nfs dependencies.

```bash
sudo apt-get update
sudo apt-get install --assume-yes nfs-common
```

Then you can mount nfs into your machine:
```bash
sudo mkdir -p MOUNT_PATH
sudo mount -t nfs4 NFS_SERVER:/NFS_PATH MOUNT_PATH
```

Copy your data to the mount point will upload your data to `NFS`.

The `NFS_SERVER` and `NFS_PATH` can be found in the storage section on your profile page.

#### Upload data to NFS server in Windows

You could access `NFS` data by `Windows File Explorer` directly if:

  - The cluster administrator setup `NFS` by `storage-manager`. `storage-manager` will provide a `samba` server. 
  - The cluster administrator configures a `samba` server along with the `NFS` server by himself.

To access it, use the file location `\\NFS_SERVER_ADDRESS` in `Window File Explorer`. It will prompt you to type in a username and a password:

  - If OpenPAI is in basic authentication mode (this mode means you use basic username/password to log in to OpenPAI webportal), you can access nfs data through its configured username and password. Please note it is different from the one you use to log in to OpenPAI. If the administrator uses `storage-manager`, the default username/password for NFS is `smbuser` and `smbpwd`.

  - If OpenPAI is in AAD authentication mode, you can access nfs data through user domain name and password.

If it doesn't work, please make sure the `network discovery` is on, or contact your adminstrator for help.

If you cannot use direct access, please try to mount NFS into Windows or using a Linux VM to upload data.

### Upload data to Azure Blob or Azure File

For Azure Blob, you can get the `storage account name` and `container name` on the profile page.

For Azure File, you can get the `storage account name` and `file share name` on the profile page.

To upload data to Azure Blob or Azure File, please:

1. Download [Azure Storage Explorer](https://azure.microsoft.com/en-us/features/storage-explorer/)
2. If you use AAD to login to PAI portal, the administrator should already grant you the permission to access storage. You can get the `storage account name`, `container name` and `file share name` on the profile page. Please use them to access storage in `Azure Storage Explorer`. For more details, please refer to [storage explore: add resource via azure ad](https://docs.microsoft.com/en-us/azure/vs-azure-tools-storage-manage-with-storage-explorer?tabs=windows#add-a-resource-via-azure-ad)
3. If you use basic authentication (username/password) to login to PAI portal. Please ask your administrator for the storage `access key`. Then you can add the storage by `access key` and `storage account name`. For more details, please refer to: [storage explore: use name and key](https://docs.microsoft.com/en-us/azure/vs-azure-tools-storage-manage-with-storage-explorer?tabs=windows#use-a-name-and-key)

## Use Storage in Jobs

### Use Data Section UI

You can use the `Data` Section on the job submission page to select desired storage:

![storage submit](./imgs/storage-submit-data.png "storage submit")

As shown in the picture, corresponding storage will be mounted to `/mnt/confignfs` folder.

### Use Job Configuration File

You can also specify storage names in `extras.storages` section in the [job configuration file](./advanced-jobs.md#job-protocol-export-and-import-jobs):

```yaml
extras:
    storages:
    - name: confignfs
      mountPath: /data
    - name: azure-file-storage
```

There are two fields for each storage, `name` and `mountPath`. `name` refers to storage name while `mountPath` is the mount path inside job container. `mountPath` has default value `/mnt/${name}` and is optional.

```yaml
extras:
    storages: []
```

Set it to an empty list will mount default storage for current user in the job.
