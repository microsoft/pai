# storagectl

A tool to manage your storage config.

## Index
- [ Manage server config ](#Server_config)
    - [ Set server config ](#Server_set)
        - [ Set nfs server config ](#Server_set_nfs)
        - [ Set samba server config ](#Server_set_samba)
        - [ Set azurefile server config ](#Server_set_azurefile)
        - [ Set azureblob server config ](#Server_set_azureblob)
    - [ List server config ](#Server_list) 
    - [ Delete server config ](#Server_delete) 

- [ Manage group config ](#Group_config)
    - [ Set group config ](#Group_set)
    - [ List group config ](#Group_list) 
    - [ Delete group config ](#Group_delete) 

- [ Manage user config ](#User_config)
    - [ Set user config ](#User_set)
    - [ List user config ](#User_list) 
    - [ Delete user config ](#User_delete) 


## Manage Server Config <a name="Server_config"></a> 

### Set server config <a name="Server_set"></a> 
Set server config in PAI.

#### Set nfs server config <a name="Server_set_nfs"></a> 
```
./storagectl.py server set NAME nfs ADDRESS ROOTPATH
```

#### Set samba server config <a name="Server_set_samba"></a> 
```
./storagectl.py server set NAME samba ADDRESS ROOTPATH USERNAME PASSWORD DOMAIN
```

#### Set azurefile server config <a name="Server_set_azurefile"></a> 
```
./storagectl.py server set NAME azurefile DATASTORE FILESHARE ACCOUNTNAME KEY [-p PROXY_ADDRESS PROXY_PASSWORD]
```

#### Set azureblob server config <a name="Server_set_azureblob"></a> 
```
./storagectl.py server set NAME azureblob DATASTORE CONTAINERNAME ACCOUNTNAME KEY
```

### List server config <a name="Server_list"></a> 
```
./storagectl.py server list [-n SERVER_NAME_1, SERVER_NAME_2 ...]
```
- If -n specified, list certain servers. Otherwise list all servers.

### Delete server config <a name="Server_delete"></a> 
```
./storagectl.py user delete SERVER_NAME
```


## Manage Group Config <a name="Group_config"></a> 

### Set group config <a name="Group_set"></a> 
```
./storagectl.py group set GROUP_NAME SERVER_NAME_1 [SERVER_NAME_2 ...] [-m MOUNT_POINT SERVER PATH]...
```
- SERVER_NAME_1 means groups useable servers.
- -m means the mount info for group. If -m specified, the PATH on SERVER will be mount to MOUNT_POINT.
    - In PATH, %USER indicates current PAI user
    - In PATH, %JOB indicates current job name

For example, suppose we have set group using:
```
./storagectl.py group set SAMPLE_GROUP SAMPLE_SERVER -m /mnt/job SAMPLE_SERVER users/%USER/jobs/%job
```
Suppose current user is 'paiuser' and current job is 'job-TEST'. This config will mount SAMPLE_SERVER/users/paiuser/jobs/job-TEST to /mnt/job

### List group config <a name="Group_list"></a> 
```
./storagectl.py group list [-n GROUP_NAME_1, GROUP_NAME_2 ...]
```
- If -n specified, list certain groups. Otherwise list all groups.

### Delete group config <a name="Group_delete"></a> 
```
./storagectl.py group delete GROUP_NAME
```


## Manage User Config <a name="User_config"></a> 

### Set user config <a name="User_set"></a> 
```
./storagectl.py user set USER_NAME SERVER_NAME_1 [SERVER_NAME_2 ...]
```

### List user config <a name="User_list"></a> 
```
./storagectl.py user list [-n USER_NAME_1, USER_NAME_2 ...]
```
- If -n specified, list certain users. Otherwise list all users.

### Delete user config <a name="User_delete"></a> 
```
./storagectl.py user delete USER_NAME
```
