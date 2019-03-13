# storagectl

A tool to manage your storage config.

## Index
- [ Init storage settings ](#Init)
    - [Init with no default external storage](#Init_None)
    - [Init with a nfs server as default external storage](#Init_Nfs)
- [ Push storage settings ](#Push)
    - [ Push external settings ](#Push_External)
    - [ Push user settings ](#Push_User)
- [ Appendix: An example storage settings ](#Storage_Example)


## Init storage settings <a name="Init"></a>


### Init with no default external storage <a name="Init_None"></a>

```
python storagectl.py init [-f] none  
```

- Create default.json with no storage server.
	- If -f was specified, it will override existing default.json on k8s server settings, else it will exit if default.json already exists.
	- Create default user storage settings for all PAI users as well

### Init with a nfs server as default external storage <a name="Init_Nfs"></a>
```
python storagectl.py init [-f] nfs address rootpath  
```
- Create default.json with nfs server.
	- If -f was specified, it will override existing default.json on k8s server settings, else it will exit if default.json already exists.
	- Create default user storage settings for all PAI users as well


## Push storage settings <a name="Push"></a>


### Push external settings <a name="Push_External"></a>

```
python storagectl.py push external /path/to/external-config/dir/or/file
```

- Create or update external storage config


### Push user settings <a name="Push_User"></a>

```
python storagectl.py push user /path/to/user-config/dir/or/file
```

- Create or update user storage config


## Appendix: An example storage settings <a name="Storage_Example"></a>

- External storage config example:
  default.json
```json
{
    "type": "nfs",
    "title": "default nfs",
    "address": "10.0.0.1",
    "rootPath": "/mnt"
}
```

- User storage config example:
  user1.json
```json
{
    "defaultStorage": "default.json",
    "externalStorages": [
        "default.json"
    ]
}
```