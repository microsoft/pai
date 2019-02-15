# node_maintain

## Overview

Graceful decommissioning could minimize the impact on existing job when remove unhealthy nodes. 
This is a tool to help you achieve it in OpenPAI. 


**NOTES: This tool only decommission node in YARN, HDFS will not be decommissioned.**

## Subcommand

In OpenPAI, an unhealthy node-list records the nodes to be decommissioned. 
The list will be synced to necessary components, then every component could remove them as needed.

Currently, node-list update and component refresh are both manual actions. 
This tool provide corresponding command for them. 
The only mandatory argument for all commands is `master_ip`. Usually, components share the same master ip,
in different case(i.e. load-balance), you could overwrite `master_ip` separately by `--kubernetes-ip` and `--yarn-ip`

So, a common invoking looks like:
```bash
python node_maintain.py {master_ip} sub-command sub-command-arguments
```


### node-list sub-command

`node-list` command could get and edit unhealthy node-list, 
notice that the change will not trigger the real refresh behavior.

* `node-list get`: print current unhealthy node-list
* `node-list add nodes`: add nodes to current node-list
* `node-list remove nodes`: remove nodes from current node-list
* `node-list update nodes`: overwrite current node-list with nodes


### refresh sub-command

Enforce the node-list, it's a blocking command and won't exit until all nodes in node-list are decommissioned.


## Scenario

In this section, we assume you have a cluster without load-balance, as below:
```
10.0.0.10 master
10.0.0.1 work-1
10.0.0.2 work-2
10.0.0.3 work-3
```

### Decommission nodes

At some point, `work-1` and `work-2` encounter hardware issues, need a graceful decommission:

##### 1. Add unhealthy node to node-list

```bash
cd src/tools
python node_maintain.py 10.0.0.10 node-list add 10.0.0.1,10.0.0.2
```

##### 2. Refresh nodes

```bash
python node_maintain.py 10.0.0.10 refresh
```

### Recommission nodes

Then if work-1 is repaired, you could recommission it to your cluster:

##### 1. Remove repaired node from node-list

```bash
python node_maintain.py 10.0.0.10 node-list remove 10.0.0.1
```

##### 2. Refresh nodes

```bash
python node_maintain.py 10.0.0.10 refresh
```

