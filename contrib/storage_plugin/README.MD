# Team wise storage

A tool to manage external storage in PAI.

## Index
- [ What is team wise storage](#Team_storage)
- [ Team wise storage usages ](#Usages)
    - [ Setup server ](#Usages_setup_server)	
    - [ Create storage server in PAI ](#Usages_server)
    - [ Create storage config in PAI ](#Usages_config)
    - [ Set storage config access for group ](#Usages_groupsc)
    - [ Use Storage in PAI ](#Usages_job)
    - [ Example ](#Usages_example)
- [ Storage data structure ](#Data_structure)
    - [ Server data structure ](#Server_data)
        - [ Nfs Server data structure ](#Nfs_data)
        - [ Samba Server data structure ](#Samba_data)
        - [ Azurefile Server data structure ](#Azurefile_data)
        - [ Azureblob Server data structure ](#Azureblob_data)
        - [ Hdfs Server data structure ](#Hdfs_data)
    - [ Config data structure ](#Config_data)
    - [ Config in group data ](#Config_in_group_data)

## What is team wise storage <a name="Team_storage"></a>
Team wise storage is a solution that helps admin to manage NAS(network attached storage) by team/group. After admin configured team wise storage settings, users can easily use NAS in their jobs.<br/>
Team wise storage solution offers:
- Multiple NAS support, including NFS, Samba, Azurefile, Azureblob and HDFS
- Configurable mount structure settings
- Mixed usage for different NAS
- Configuration for Team/Group scope

## Team wise storage usages <a name="Usages"></a>

### Setup server <a name="Usages_setup_server"></a>
- NFS

Edit /etc/exports, export /root/path/to/share 
```
/root/path/to/share (rw, sync, no_root_squash) 
```
no_root_squash is needed for storage plugin to creae folders.

- Samba

After create samba server, create user for PAI to use samba.
```
useradd paismb
smbpasswd -a paismb
#Input password for paismb
```

- Azurefile

Create Azurefile share through azure web portal.

- Azureblob

Create Azureblob share through azure web portal.


### Create storage server in PAI <a name="Usages_server"></a>  
In PAI dev-box, swith to folder pai/contrib/storage-plugin

Create server config using command:
- NFS:
```
python storagectl.py server set NAME nfs ADDRESS ROOTPATH
```

- Samba:
```
python storagectl.py server set NAME samba ADDRESS ROOTPATH USERNAME PASSWORD DOMAIN
```

- Azurefile:
```
python storagectl.py server set NAME azurefile DATASTORE FILESHARE ACCOUNTNAME KEY
  ```

- Azureblob:
``` 
python storagectl.py server set NAME azureblob DATASTORE CONTAINERNAME ACCOUNTNAME KEY
```

- HDFS:
``` 
python storagectl.py server set NAME hdfs NAMENODE PORT
```

### Create storage config in PAI <a name="Usages_config"></a>  
In PAI dev-box, swith to folder pai/contrib/storage-plugin

Create config using command:
```
python storagectl.py config set CONFIG_NAME GROUP_NAME [-s SERVER_NAME_1 SERVER_NAME_2 ...] [-m MOUNT_POINT SERVER PATH]... [-d]
```

### Set storage config access for group <a name="Usages_groupsc"></a>
In PAI dev-box, swith to folder pai/contrib/storage-plugin

Set storage config access for group using command:
```
python storagectl.py groupsc add GROUP_NAME CONFIG_NAME
```

### Use Storage info in job container <a name="Usages_job"></a>
User can use team wise storage through job submit page. Please refer to related page for details.

### Example <a name="Usages_example"></a>
Suppose admin has set up a new samba server "smbserver" on "10.0.0.0", created PAI account "paismb" with password "paipwd".
The structure of samba server is as follows:
```
-- root
    -- data
    -- users
        -- user1
        -- user2
        ...
```
Now we want all members of "paigroup" mount server's data folder to /data, and user's data (e.g user1) to /user by default. The admin should setup storage config in PAI using:
```bash
python storagectl.py server set smbserver samba 10.0.0.1 root paismb paipwd local
python storagectl.py config set configsmb -s smbserver -m /data smbserver data -m /user smbserver 'users/${PAI_USER_NAME}' -d
python storagectl.py groupsc add paigroup configsmb
```
Then when "paiuser" from "paigroup" uses job submit page, the configsmb will be shown and user can choose whether to use it <br/>


## Team wise storage data structures <a name="Data_structure"></a>

### Server data structure <a name="Server_data"></a>
```json
{
	"spn": "servername",
	"type": "nfs|samba|azurefile|azureblob"
}
```
#### Nfs Server data structure <a name="Nfs_data"></a>
```json
{
	"spn": "servername",
	"type": "nfs",
	"address": "server/address",
	"rootPath": "server/root/path"
}
```

#### Samba Server data structure <a name="Samba_data"></a>
```json
{
	"spn": "servername",
	"type": "samba",
	"address": "server/address",
	"rootPath": "server/root/path",
	"userName": "username",
	"password": "password",
	"domain": "userdomain"
}
```

#### Azurefile Server data structure <a name="Azurefile_data"></a>
```json
{
	"spn": "servername",
	"type": "azurefile",
	"dataStore": "datastore",
	"fileShare": "fileshare",
	"accountName": "accountname",
	"key": "key"
}
```

#### Azureblob Server data structure <a name="Azureblob_data"></a>
```json
{
	"spn": "servername",
	"type": "azureblob",
	"dataStore": "datastore",
	"containerName": "containername",
	"accountName": "accountname",
	"key": "key"
}
```

#### Hdfs Server data structure <a name="Hdfs_data"></a>
```json
{
	"spn": "servername",
	"type": "hdfs",
	"namenode": "namenode",
	"port": "port",
}
```

### Config data structure <a name="Config_data"></a>
```json
{
	"name": "configname",
	"gpn": "groupname",
	"default": false,
	"servers": [
		"servername",
	],
	"mountInfos": [
	    {
	        "mountpoint": "local/mount/point",
	        "server": "servername",
	        "path": "server/sub/path"
	    },
	]
}
```

- MountInfo: How user mount server path to local.
```json
{
	"mountpoint": "local/mount/point",
	"server": "servername",
	"path": "server/sub/path"
}
```

### Config in group data<a name="Config_in_group_data"></a>
- Which storage configs that a group can access is stored in group data's extension field. For example, a group that can access STORAGE_CONFIG is like following:
```json
{
	"groupname": "groupname",
	"externalName": "externalName",
	"description": "description",
	"extension": {
		"acls": {
			"admin": false,
			"virtualClusters": [],
			"storageConfigs": ["STORAGE_CONFIG"]
		}
	}
}
```
