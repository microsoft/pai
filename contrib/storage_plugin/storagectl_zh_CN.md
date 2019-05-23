# storagectl

A tool to manage your storage config.

## Index
- [ Manage server ](#Server_config)
    - [ Set server ](#Server_set)
        - [ Set nfs server ](#Server_set_nfs)
        - [ Set samba server ](#Server_set_samba)
        - [ Set azurefile server ](#Server_set_azurefile)
        - [ Set azureblob server ](#Server_set_azureblob)
    - [ List server ](#Server_list) 
    - [ Delete server ](#Server_delete) 

- [ Manage config ](#Config_config)
    - [ Set config ](#Config_set)
    - [ List config ](#Config_list) 
    - [ Delete config ](#Config_delete) 

- [ Manage user ](#User_config)
    - [ Set user ](#User_set)
    - [ List user ](#User_list) 
    - [ Delete user ](#User_delete) 


## Manage Server <a name="Server_config"></a> 
Manage server in PAI. Server how PAI access a nas server.
### Set server <a name="Server_set"></a> 

#### Set nfs server <a name="Server_set_nfs"></a> 
```
./storagectl.py server set NAME nfs ADDRESS ROOTPATH
```

#### Set samba server <a name="Server_set_samba"></a> 
```
./storagectl.py server set NAME samba ADDRESS ROOTPATH USERNAME PASSWORD DOMAIN
```

#### Set azurefile server <a name="Server_set_azurefile"></a> 
```
./storagectl.py server set NAME azurefile DATASTORE FILESHARE ACCOUNTNAME KEY [-p PROXY_ADDRESS PROXY_PASSWORD]
```

#### Set azureblob server <a name="Server_set_azureblob"></a> 
```
./storagectl.py server set NAME azureblob DATASTORE CONTAINERNAME ACCOUNTNAME KEY
```

### List server <a name="Server_list"></a> 
```
./storagectl.py server list [-n SERVER_NAME_1, SERVER_NAME_2 ...]
```
- If -n specified, list certain servers. Otherwise list all servers.

### Delete server <a name="Server_delete"></a> 
```
./storagectl.py user delete SERVER_NAME
```


## Manage Config <a name="Config_config"></a> 
Manage configs for group in PAI. Config defines a set of mount infos. Every config belongs to a group. That is to say, one group may have 0 to n configs.
### Set config <a name="Config_set"></a> 
```
./storagectl.py config set CONFIG_NAME GROUP_NAME [-s SERVER_NAME_1 SERVER_NAME_2 ...] [-m MOUNT_POINT SERVER PATH]... [-d]
```
- GROUP_NAME means All members of GROUP_NAME can use this config.
- -s defines config useable servers.
- -m means the mount info for config. If -m specified, the PATH on SERVER will be mount to MOUNT_POINT.
    - In PATH, %USER indicates current PAI user
    - In PATH, %JOB indicates current job name
- If -d is set, means mount config storage by default.

For example, suppose we have set config using:
```
./storagectl.py config set SAMPLE_CONFIG SAMPLE_GROUP -s SAMPLE_SERVER -m /mnt/job SAMPLE_SERVER users/%USER/jobs/%JOB
```
If current user is 'paiuser' and current job is 'job-TEST'. This config will mount SAMPLE_SERVER/users/paiuser/jobs/job-TEST to /mnt/job

### List config <a name="Config_list"></a> 
```
./storagectl.py config list [-n CONFIG_NAME_1, CONFIG_NAME_2 ...]
```
- If -n specified, list certain configs. Otherwise list all config.

### Delete config <a name="Config_delete"></a> 
```
./storagectl.py config delete CONFIG_NAME
```


## Manage User Config <a name="User_config"></a> 
Manage PAI user's specific servers.
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
