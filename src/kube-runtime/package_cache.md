## Package Cache

Some runtime plugins use `apt update` and `apt install ...` to install packages. If the network connection from pai cluster to the apt repository is poor, `apt install` may take a long period of time or fail.

Since we use kube runtime to initialize the environment before job container, it is possible to use the runtime container as a "cache" of some frequently-needed packages.

Note: `Package Cache` only stores packages for systems of arch `x64`.

## How to enable cache for your plugin

**1. Add packages you want to store cache for in the file [`package_cache_info`](src/package_cache/package_cache_info)**:

```
# group_name, os, packages(space-gapped)
# "#" can be used for comments
ssh,ubuntu16.04,openssh-client openssh-server
ssh,ubuntu18.04,openssh-client openssh-server
nfs,ubuntu16.04,nfs-common
nfs,ubuntu18.04,nfs-common
```

The first column is `group_name`. One group can contain multiple packages. The second column stands for the OS type. Currently only `ubuntu16.04` and `ubuntu18.04` are supported. The third column is the packages you want to add for the group. The last column is the precommands, which will be executed before gathering packages and it can be left empty.

**2. In `init.py` of each plugin:**

```python
from plugins.plugin_utils import try_to_install_by_cache
command = [
    try_to_install_by_cache('<group_name>', fallback_cmds=[
        '<fallback commands>',
    ])
]    
```

`try_to_install_by_cache(group_name, fallback_cmds)` will generate a script to install all packages of a certain group name. It guarantees:

- If it returns 0, all the packages are installed successfully.
- If it has a non-zero exit code, the package installation has failed. Reasons could be that the required cache is not found or other internal problems. In such case, plugin will executes the `fallback_cmds` instead. You can use `apt-get`, `yum` or other commands to install the packages.

Here is an example for the `ssh` plugin:

```python
command = [
    try_to_install_by_cache('ssh', fallback_cmds=[
        'apt-get update',
        'apt-get install -y openssh-client openssh-server',
    ]),
    '......'
]
```

## Optimization (TBD)

1. Use hash of package url to save storage space: Packages with the same url can be saved together.
