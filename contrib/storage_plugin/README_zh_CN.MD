# Team wise storage

A tool to manage external storage in PAI.

## Index
- [ Storage data structure ](#Data_structure)
    - [ Server data structure ](#Server_data)
		- [ Nfs Server data structure ](#Nfs_data)
		- [ Samba Server data structure ](#Samba_data)
		- [ Azurefile Server data structure ](#Azurfile_data)
		- [ Azureblob Server data structure ](#Azureblob_data)
	- [ Group data structure ](#Group_data)
    - [ User data structure ](#User_data)
- [ Team wise storage usages ](#Usages)
    - [ Setup server ](#Usages_setup_server)	
    - [ Create server config ](#Usages_server)
	- [ Create group config ](#Usages_group)
    - [ Create user config (optional) ](#Usages_user)
    - [ Use Storage in PAI ](#Usages_job)


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

#### Azureblob Server data structure <a name="Azurefile_data"></a>
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


### Group data structure <a name="Group_data"></a>
```json
{
	"gpn": "groupname",
	"default": false,
	"servers": [
		"servername1",
		"servername2",
		...
	],
	"mountInfos": [
		MountInfo1,
		MountInfo2,
		...
	]
}
```

- MountInfo: How a group member mount server path to local.
```json
{
	"mountpoint": "local/mount/point",
	"server": "servername",
	"path": "server/sub/path"
}
```

### User data structure <a name="User_data"></a>
```json
{
	"servers": [
		"servername1",
		"servername2",
		...
	]
}
```


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
Create Azurefile share through azure web portal.


### Create server config in PAI storage plugin <a name="Usages_server"></a>  
In PAI dev-box, swith to folder pai/contrib/storage-plugin

Create server config using command:
- NFS:
```
./storagectl.py server set NAME nfs ADDRESS ROOTPATH
```

- Samba:
```
./storagectl.py server set NAME samba ADDRESS ROOTPATH USERNAME PASSWORD DOMAIN
```

- Azurefile:
```
./storagectl.py server set NAME azurefile DATASTORE FILESHARE ACCOUNTNAME KEY
  ```

- Azureblob:
``` 
./storagectl.py server set NAME azureblob DATASTORE CONTAINERNAME ACCOUNTNAME KEY
```

### Create group config in PAI storage plugin <a name="Usages_group"></a>  
In PAI dev-box, swith to folder pai/contrib/storage-plugin

Create group config using command:
```
./storagectl.py group set GROUP_NAME SERVER_NAME_1 [SERVER_NAME_2 ...] [-m MOUNT_POINT SERVER PATH]...
```

### Create user config in PAI storage plugin (optional) <a name="Usages_user"></a>
In PAI dev-box, swith to folder pai/contrib/storage-plugin

Create user config using command:
```
./storagectl.py user set USER_NAME SERVER_NAME_1 [SERVER_NAME_2 ...]
```
User config defines user's permissions on servers.

### Use Storage info in job container <a name="Usages_job"></a>
User can use NAS through submit-nas-job plugin. Please refer to related page for details.