# dedicated_vc

## Overview

Unlike shared virtual cluster sharing whole cluster resource, dedicated vc is bound to specific nodes. 
"Dedicated" here is bidirectional, in other words, dedicated vc could only use bound nodes, 
and these node could only be used by this vc. 
Noticed that dedicated resource will be excluded from shared resource.
shared_vc_resource = (whole_resource - dedicated_resource) * shared_vc_capacity

This doc introduces how to configure dedicated vc, currently we provide only cmdline tool for it.

## Commands

We provide get, add and remove dedicate vc in the node_maintain.py, working directory is pai/src/tools.
```bash
python node_maintain.py dedicated-vc {get,add,remove}
```

### Get dedicated-vc

```bash
python node_maintain.py dedicated-vc get -m {master_ip}
```
This command output dedicated vc name, nodes and total resource, as below:
```
dedicated_1:
        Nodes:
        Resource: <CPUs:0.0, Memory:0.0MB, GPUs:0.0>
dedicated_2:
        Nodes: 10.0.0.1
        Resource: <CPUs:24.0, Memory:208896.0MB, GPUs:4.0>
```


### Add dedicated-vc

```bash
python node_maintain.py dedicated-vc add -m {master_ip} -v {added_vc_name} [-n {added_nodes}]
```
This command added {added_nodes} to {added_vc_name}, if {added_vc_name} doesn't exist, it will be created firstly.

Added resource will be subtracted from default vc.

### Remove dedicated-vc

```bash
python node_maintain.py dedicated-vc remove -m {master_ip} -v {removed_vc_name} [-n {removed_nodes}]
```
This command delete {removed_nodes} from {removed_vc_name}, if omit {removed_nodes}, it will delete whole vc.

Deleted resource will be back to default vc




