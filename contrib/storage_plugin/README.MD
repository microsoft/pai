# Team wise storage

A tool to manage external storage in PAI.

## Index
- [ Storage data structure ](#Data_structure)
    - [ Server data structure ](#Server_data)
    - [ User data structure ](#User_data)
- [ Team wise storage usages ](#Useages)
    - [Setup NFS server ](#Useages_nfs)
    - [Create server config in PAI storage plugin ](#Useages_server)
    - [Create user config in PAI storage plugin ](#Useages_user)
    - [Use Storage info in job container ](#Useages_job)


## Team wise storage data structures <a name="Data_structure"></a>

### Server data structure <a name="Server_data"></a>
    ```json
    {
		"type": "nfs",
		"title": "default nfs",
		"address": "10.0.0.1",
		"rootPath": "/mnt",
		"sharedFolders": ["data"]
		"privateFolders": ["users"]
    }
    ```
    type: Remote server type, currently support nfs.
    title: Shown name on server selection.
    address: Remote server address.
    rootPath: The root share folder on remote server.
    sharedFolders: The shared folders under root path. Remote server will create folders like [rootPath]/[sharedFolder].
    privateFolders: The private folders for users. The value is the parent folder before user name. Remote server will create folders like [rootPath]/[privateFolder]/[userName]


### User data structure <a name="User_data"></a>
    ```json
    {
		"defaultStorage": "storage name",
		"externalStorages": [
			"storage name",
	 		"storage name2"
	 	]
	}
    ```
    defaultStorage: The default storage config used for user.
    externalStorages: User will have permission and his own private folders on all servers in externamStorages according to storage settings.


## Team wise storage usages <a name="Usages"></a>
### Setup NFS server <a name="Usages_nfs"></a>
    Remote server 10.0.0.1
    Root folder /share/teamA

    Edit /etc/exports, export /share/teamA 
    ```
    /share/teamA (rw, sync, no_root_squash) 
    ```
    no_root_squash is needed for storage plugin to creae folders.


### Create server config in PAI storage plugin <a name="Usages_server"></a>  
	In PAI dev-box, swith to folder contrib/storage-plugin

    Create server config using command:
    ```
    python storagectl.py storage set teamA 10.0.0.1 /share/teamA --sharedfolders data --privatefolders users
    ```

    - This will do the following things:
		Update k8s configmap, save server config
		Check remote nfs exports
		Create temp folder, mount remote folder, 
			Check and create /share/teamA/data on server as public folder if needed
			Create private folder /share/teamA/users/[user name] for all users who have access to the server
		Unmount and delete temp folder
   

### Create user config in PAI storage plugin <a name="Usages_user"></a>
	In PAI dev-box, swith to folder contrib/storage-plugin

	Create user config using command:
	```
	python storagectl.py user setdefault user1 teamA
	```

	- This will do the following things:
		Set server teamA as user1's default external storage server
		Add teamA in to user1's available storage servers
		Create user1's private folder on teamA server


### Use Storage info in job container <a name="Usages_job"></a>
	Use RestAPI to get user infomation 




