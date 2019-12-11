Feature History for `pai-for-edu` Branch
----

This documents is to trace the feature developing of the branch.

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
  
- Related pull requests
  - [#3942](https://github.com/microsoft/pai/pull/3942) adds unified filesystem interface, start-container cli, and ssh-container cli.
