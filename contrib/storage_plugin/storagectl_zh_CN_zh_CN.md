# storagectl

A tool to manage your storage config.

## Index

- [ Init storage settings ](#Init)
    
    - [Init with no default external storage](#Init_None)
    - [Init with a nfs server as default external storage](#Init_Nfs)

- [ Manage Server Config ](#Server_config)
    
    - [ Set server config for nfs ](#Server_set)
    - [ List server config ](#Server_list)
    - [ Create path for server ](#Server_createpath)

- [ Manage user config ](#User_config)
    
    - [ Set user default server ](#User_setdefault)
    - [ List user config ](#User_list) 

- [ Push storage settings ](#Push)
    
    - [ Push server settings ](#Push_server)
    - [ Push user settings ](#Push_user)

## Init storage settings <a name="Init"></a>

### Init with no default external storage <a name="Init_None"></a>

    python storagectl.py init [-f] none  
    

- Create default.json with no storage server. 
    - If -f was specified, it will override existing default.json on k8s server settings, else it will exit if default.json already exists.
    - Create default user storage settings for all PAI users as well

### Init with a nfs server as default external storage <a name="Init_Nfs"></a>

    python storagectl.py init [-f] nfs address rootpath  
    

- Create default.json with nfs server. 
    - If -f was specified, it will override existing default.json on k8s server settings, else it will exit if default.json already exists.
    - Create default user storage settings for all PAI users as well

## Manage Server Config <a name="Server_config"></a>

### Set server config for nfs <a name="Server_set"></a>

    python storagectl.py server set SERVER_NAME nfs ADDRESS ROOT_PATH [--sharedfolders SHARED_FOLDERS [SHARED_FOLDERS ...]] [--privatefolders PRIVATE_FOLDERS [PRIVATE_FOLDERS ...]] 
    

- Create or modify server config
- If '--sharedfolders' is set, create shared folders ROOT_PATH/SHARED_FOLDERS on remote server.
- If '--privatefolders' is set, create user private folders ROOT_PATH/PRIVATE_FOLDERS/USER_NAME for every user associated with the server on remote server.

### List server config <a name="Server_list"></a>

    python storagectl.py server list
    

- List all servers

### Create path for server <a name="Server_createpath"></a>

    python storagectl.py server createpath SERVER_NAME
    

- Check and create path for server if needed

## Manage User Config <a name="User_config"></a>

### Set user default server <a name="User_setdefault"></a>

    python storagectl.py user setdefault USER_NAME SERVER_NAME
    

- Set default server for user 
    - If privatefolders was defined on server, create privae folders for user on ROOT_PATH/PRIVATE_FOLDERS/USER_NAME

### List user config <a name="User_list"></a>

    python storagectl.py user list
    

- List all users

## Push storage settings <a name="Push"></a>

### Push server settings <a name="Push_server"></a>

    python storagectl.py push server /path/to/server-config/dir/or/file
    

- Create or update server config

### Push user settings <a name="Push_user"></a>

    python storagectl.py push user /path/to/user-config/dir/or/file
    

- Create or update user storage config