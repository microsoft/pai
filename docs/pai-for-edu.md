Introduction to Special Edition (`pai-for-edu`)
----

The purpose of this branch is to provide a user friendly special edition of `OpenPAI`. We synced with master branch frequently, offer some essential services and features missing in master, and also hide some features and modes that are too complicated.

# When to choose the special edition

- Users who want to get an out-of-box experience
- Users who want to get quickly started
- Users who don't care too much low level details
- Users who want to deploy `OpenPAI` in a clean environment

# Features

## Database driven features

### [x] `etcd` to DB synchronizer - basic job / user info

- List and watch `etcd` objects changing and write them to database
- handle `write-after-write` (WAW) hazard by 
  - use a FSM switching between `list->watch->list->watch`...
  - use `async-lock` to let keep the order of operations to same record
- Related pull requests
  - [#4018](https://github.com/microsoft/pai/pull/4018) add synchronizer

### [ ] `etcd` to DB synchronizer - job history

- Use database as a full functioned job history server

### [ ] User expression

- let users save some frequently used information (key-value) in DB
- Leverage this feature we could implement keys management `ssh_pulic_key`, `ssh_private_key` ...
- offer [APIs](https://github.com/microsoft/pai/blob/2d3ed4ecccaddf60a1d7fc5edaba0628ce62392f/docs/rest-server/extended-api.md) to let user create/update/view/delete expressions 
- Related pull requests:
  - [#4050](https://github.com/microsoft/pai/pull/4050) add user expression apis

### [ ] Favorite jobs

- users can star (add favorite) jobs

### [ ] Job tags

- add tags for a job

### [ ] Marketplace

## Storage enhanced features

### [x] Job Persistence
  
- Every job will be allocated a persistent storage location, which could be used to store source codes, check points, etc.
- Deployment of this branch will make sure a default storage is available
  - A default storage service (currently `HDFS`) will be started
  - The default storage server and config will be register in cluster config map
  - the default storage config will be allocated to `default` user group
- `kube` runtime plugin will transparently sync the contents
  -  during job container starting (in pre-commands), the plugin will download job's input contents to local `/persistent/inputs`
  -  after user commands completes (in post-commands), the plugin will upload contents in `/persistent/outputs` to the persistent storage (prefixed by task role name and index)
- The information of allocated job storage will be stored and queried by database  
- Related pull requests
  - [#3919](https://github.com/microsoft/pai/pull/3919) adds a cluster type `full`, and enable HDFS `namenode` and `datanode`.
  - [#3990](https://github.com/microsoft/pai/pull/3990) registers a system-level hdfs storage by default, and hides hdfs storage in job submission page.
  - [#4005](https://github.com/microsoft/pai/pull/4005) `kube` runtime plugin (persistence) update
  - [#4006](https://github.com/microsoft/pai/pull/4006) `python` SDK update for job persistence
  
### [x] Unified Storage Interface & Python SDK Update
- Simply user interface of CLI (new `pai` commands) while old `opai` commands are still be supported
- Provide [Unified Storage Interface](../contrib/python-sdk/README.md), which could hide storage details for users 
- Users could get storage configs provisioned by cluster by the [get storage config API](https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/microsoft/pai/master/src/rest-server/docs/swagger.yaml#operation/getStorageConfigs), and the retrieved [storage config](https://github.com/microsoft/pai/tree/master/contrib/storage_plugin#config-data-structure-) contains a list of storage paths like 
```json
{
	"name": "configname",
	"mountInfos": [
	    {
	        "server": "servername",
	        "path": "server/sub/path"
	    },
	]
}
```
- User could access the provisioned storage path by the unified path 
```
pai://<cluster-alias>/<configname>~<mount-index>/path/to/destination
```

- Related pull requests
  - [#3942](https://github.com/microsoft/pai/pull/3942) adds unified filesystem interface, start-container cli, and ssh-container cli.


## Debuggability 

### [ ] Playground - official sleepy / notebook integration

- add shortcut to start a special kind of commands
  - a sleepy job with commandry timeout `sleep <timeout>` 
  - a `jupyter` notebook (maybe also with timeout) 

### [ ] Key management for `ssh`

- When creating users, add a default keys for ssh in user expression
- User doesn't need to specify keys in `ssh` plugin

### [ ] Quick open button for `ssh` or notebook

- detect job has `ssh` or notebook connection by ports declaration
- try to generate complete command to open `ssh` (with keys)
  - if possible, open it in browser
- open notebook connection by one click

