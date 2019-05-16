# Team wise storage

A tool to manage external storage in PAI.

## Index
- [ Team wise storage usages ](#Usages)
    - [ Setup server ](#Usages_setup_server)	
    - [ Create storage server in PAI ](#Usages_server)
	  - [ Create storage config in PAI ](#Usages_config)
    - [ Create storage user in PAI(optional) ](#Usages_user)
    - [ Use Storage in PAI ](#Usages_job)
		- [ Example ](#Usages_example)
- [ Storage data structure ](#Data_structure)
  - [ Server data structure ](#Server_data)
		- [ Nfs Server data structure ](#Nfs_data)
		- [ Samba Server data structure ](#Samba_data)
		- [ Azurefile Server data structure ](#Azurfile_data)
		- [ Azureblob Server data structure ](#Azureblob_data)
	- [ Config data structure ](#Config_data)
  - [ User data structure ](#User_data)

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

### Create storage config in PAI <a name="Usages_config"></a>  
In PAI dev-box, swith to folder pai/contrib/storage-plugin

Create config using command:
```
./storagectl.py config set CONFIG_NAME GROUP_NAME [-s SERVER_NAME_1 SERVER_NAME_2 ...] [-m MOUNT_POINT SERVER PATH]... [-d]
```

### Create storage user in PAI (optional) <a name="Usages_user"></a>
In PAI dev-box, swith to folder pai/contrib/storage-plugin

Create user config using command:
```
./storagectl.py user set USER_NAME SERVER_NAME_1 [SERVER_NAME_2 ...]
```
User config defines user's permissions on servers.

### Use Storage info in job container <a name="Usages_job"></a>
User can use NAS through submit-nas-job plugin. Please refer to related page for details.

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
./storagectl.py server set smbserver samba 10.0.0.1 root paismb paipwd local
./storagectl.py config set configsmb paigroup -s smbserver -m /data smbserver data -m /user smbserver users/%USER -d
```
Then when "paiuser" from "paigroup" use "Submit NAS Job" plugin to submit job, the following page will be shown:
 


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
		MountInfo,
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