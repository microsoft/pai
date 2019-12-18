Introduction to Special Edition (`pai-for-edu`)
----

The purpose of this branch is to provide a user friendly special edition of `OpenPAI`. We synced with master branch frequently, offer some essential services and features missing in master, and also hide some features and modes that are too complicated.

# When to choose the special edition

- Users who want to get an out-of-box experience
- Users who want to get quickly started
- Users who don't care too much low level details
- Users who want to deploy `OpenPAI` in a clean environment

# Features History

## Job Persistence
  
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
  
## Python SDK Update
- Simply user interface of CLI (new `pai` commands) while old `opai` commands are still be supported

- Provide [Unified Storage Interface](../contrib/python-sdk/README.md), which could hide storage details for users 

- Related pull requests
  - [#3942](https://github.com/microsoft/pai/pull/3942) adds unified filesystem interface, start-container cli, and ssh-container cli.


# Features Backlog

## Database pilot run

- codes will be in separate file e.g. prefixed with `extend` in rest-server 
- general database error handling mechanism

- features under developing now
  - marketplace
  - user expression

## `etcd` to DB synchronizer - basic job / user info

- List and watch `etcd` objects changing and write them to database

- handle `write-after-write` (WAW) hazard 

## `etcd` to DB synchronizer - job history

- Use database as a full functioned job history server

## Marketplace

## User expression

- let users save some frequently used information (key-value) in DB
  
- in the beginnings, we could limit the usage of this feature by only accept allowed keys e.g. `ssh_pulic_key`, `ssh_private_key` ...
  
- offer APIs to let user create/update/view/delete expressions
  - `PUT api/v2/extend/expression/user/:user` to create expressions if don't exist or update existing ones
    - `token` in HEADER
    - `{"key1": "val1", ...}` as body
  - `GET api/v2/extend/expression/user/:user` to get expressions
    - `token` in HEADER
    - `{"keys": [...]}` as body
  - `DELETE api/v2/extend/expression/user/:user` to get expressions
    - `token` in HEADER
    - `{"keys": [...]}` as body

## Favorite jobs

- users can star (add favorite) jobs

## Job tags

- add tags for a job

## Quick connect to `ssh`

- leverage keys in user expressions
- start `ssh` in browser 

## Official support of sleepy jobs

- 