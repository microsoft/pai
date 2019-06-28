# storagectl

A tool to manage your storage config.

## Index
- [ Manage group ](#Group_config)
    - [ Set group ](#Group_set)
    - [ List group ](#Group_list) 
    - [ Delete group ](#Group_delete) 

- [ Manage server ](#Server_config)
    - [ Set server ](#Server_set)
        - [ Set nfs server ](#Server_set_nfs)
        - [ Set samba server ](#Server_set_samba)
        - [ Set azurefile server ](#Server_set_azurefile)
        - [ Set azureblob server ](#Server_set_azureblob)
        - [ Set hdfs server ](#Server_set_hdfs)
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

## Manage Group Config <a name="Group_config"></a> 
Manage PAI storage groups.
### Set group config <a name="Group_set"></a> 
```
python storagectl.py group set GROUP_NAME EXTERNAL_NAME[-d DESCRIPTION]
```
- EXTERNAL_NAME is group name in AAD

### List group config <a name="Group_list"></a> 
```
python storagectl.py group list
```

### Delete group config <a name="Group_delete"></a> 
```
python storagectl.py group delete GROUP_NAME
```


## Manage Server <a name="Server_config"></a> 
Manage server in PAI. Server how PAI access a nas server.
### Set server <a name="Server_set"></a> 

#### Set nfs server <a name="Server_set_nfs"></a> 
```
python storagectl.py server set NAME nfs ADDRESS ROOTPATH
```

#### Set samba server <a name="Server_set_samba"></a> 
```
python storagectl.py server set NAME samba ADDRESS ROOTPATH USERNAME PASSWORD DOMAIN
```

#### Set azurefile server <a name="Server_set_azurefile"></a> 
```
python storagectl.py server set NAME azurefile DATASTORE FILESHARE ACCOUNTNAME KEY [-p PROXY_ADDRESS PROXY_PASSWORD]
```

#### Set azureblob server <a name="Server_set_azureblob"></a> 
```
python storagectl.py server set NAME azureblob DATASTORE CONTAINERNAME ACCOUNTNAME KEY
```

#### Set hdfs server <a name="Server_set_hdfs"></a> 
```
python storagectl.py server set NAME hdfs NAMENODE PORT
```

### List server <a name="Server_list"></a> 
```
python storagectl.py server list [-n SERVER_NAME_1, SERVER_NAME_2 ...]
```
- If -n specified, list certain servers. Otherwise list all servers.

### Delete server <a name="Server_delete"></a> 
```
python storagectl.py user delete SERVER_NAME
```


## Manage Config <a name="Config_config"></a> 
Manage configs for group in PAI. Config defines a set of mount infos. Every config belongs to a group. That is to say, one group may have 0 to n configs.
### Set config <a name="Config_set"></a> 
```
python storagectl.py config set CONFIG_NAME GROUP_NAME [-s SERVER_NAME_1 SERVER_NAME_2 ...] [-m MOUNT_POINT SERVER PATH [TAG1, TAG2...]]... [-d]
```
- GROUP_NAME means All members of GROUP_NAME can use this config.
- -s defines config useable servers.
- -m means the mount info for config. If -m specified, the PATH on SERVER will be mount to MOUNT_POINT.
    - In PATH, %USER indicates current PAI user
    - In PATH, %JOB indicates current job name
    - TAGs defines the usages of the mount point. A mount point may have multiple tags. Tags will be exported as environment variables.
- If -d is set, means mount config storage by default.

For example, suppose we have set config using:
```
python storagectl.py config set SAMPLE_CONFIG SAMPLE_GROUP -s SAMPLE_SERVER -m /mnt/job SAMPLE_SERVER users/%USER/jobs/%job
```
If current user is 'paiuser' and current job is 'job-TEST'. This config will mount SAMPLE_SERVER/users/paiuser/jobs/job-TEST to /mnt/job

### List config <a name="Config_list"></a> 
```
python storagectl.py config list [-n CONFIG_NAME_1, CONFIG_NAME_2 ...]
```
- If -n specified, list certain configs. Otherwise list all config.

### Delete config <a name="Config_delete"></a> 
```
python storagectl.py config delete CONFIG_NAME
```


## Manage User Config <a name="User_config"></a> 
Manage PAI user's specific servers.
### Set user config <a name="User_set"></a> 
```
python storagectl.py user set USER_NAME SERVER_NAME_1 [SERVER_NAME_2 ...]
```

### List user config <a name="User_list"></a> 
```
python storagectl.py user list [-n USER_NAME_1, USER_NAME_2 ...]
```
- If -n specified, list certain users. Otherwise list all users.

### Delete user config <a name="User_delete"></a> 
```
python storagectl.py user delete USER_NAME
```
