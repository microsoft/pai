# dedicated_vc

## Overview

Unlike shared Virtual Clusters sharing cluster nodes, dedicated Virtual Cluster is binding to 1 or more physical nodes. Once a node is assigned to a dedicated VC, shared VCs are no longer able to use its resource. The whole cluster resource is split as below:

    Cluster Resource
    ├── Shared Resource:
    │   ├── DEFAULT: capacity
    │   ├── Shared VC_1: capacity
    │   └── Shared VC_2: capacity
    └── Dedicated Resource:
        ├── Dedicated VC_1: node1, node2
        └── Dedicated VC_2: node3, node4
    
    shared_vc_resource = shared_resource * shared_vc_capacity
    dedicated_vc_resource = sum(dedicated_vc_nodes)
    

A job submitted to Shared VC might be scheduled to any shared nodes, oppositely, the one submitted to Dedicated VC could only be scheduled to corresponding dedicated nodes.

Currently we support configure shared_vc by web UI, but only cmdline tool for dedicated_vc. This doc introduce more details.

**dev-box environment is necessary for all below operations**

## Commands

Operating dedicated vc need admin account, please setup admin username and password as the first step:

```bash
python node_maintain.py user set -u {admin_username} -p {admin_password} -m {master_ip}
```

We provide get, add and remove dedicated vc in the node_maintain.py, working directory is pai/src/tools.

```bash
python node_maintain.py dedicated-vc {get,add,remove}
```

### Get dedicated-vc

```bash
python node_maintain.py dedicated-vc get -m {master_ip}
```

This command output dedicated vc name, nodes and resource,

#### Examples:

    $ python node_maintain.py dedicated-vc get -m 10.0.0.1
    dedicated_1:
            Nodes:
            Resource: <CPUs:0.0, Memory:0.0MB, GPUs:0.0>
    dedicated_2:
            Nodes: 10.0.0.2, 10.0.0.3
            Resource: <CPUs:24.0, Memory:208896.0MB, GPUs:4.0>
    

### Add dedicated-vc

```bash
python node_maintain.py dedicated-vc add -m {master_ip} -v {added_vc_name} [-n {added_nodes}]
```

This command added {added_nodes} to {added_vc_name}, if {added_vc_name} was not found, this command would create it firstly. Dedicated_vc resource is allocated from Shared VC pool and subtracted from DEFAULT VC quota. The remaining Shared VCs' capacity will be recalculated to ensure a constant **GPU** quota. If no enough DEFAULT quota, allocation will raise error.

#### Examples:

    # Add an empty dedicated_3
    $ python node_maintain.py dedicated-vc add -m 10.0.0.1 -v dedicated_3  
    
    # Add 10.0.0.4 to dedicated_3
    $ python node_maintain.py dedicated-vc add -m 10.0.0.1 -v dedicated_3 -n 10.0.0.4
    

### Remove dedicated-vc

```bash
python node_maintain.py dedicated-vc remove -m {master_ip} -v {removed_vc_name} [-n {removed_nodes}]
```

This command deleted {removed_nodes} from {removed_vc_name}, if {removed_nodes} omitted, it would delete whole vc. Deleted resource will be back to Shared VC pool, more specifically, to DEFAULT VC.

#### Examples:

    # Remove 10.0.0.2 from dedicated_2
    $ python node_maintain.py dedicated-vc remove -m 10.0.0.1 -v dedicated_2 -n 10.0.0.2
    
    # Remove dedicated_2 and free all nodes
    $ python node_maintain.py dedicated-vc remove -m 10.0.0.1 -v dedicated_2