# node_maintain

## Overview

Graceful decommissioning could minimize the impact on existing job when removing unhealthy nodes. 
This is a tool to help you achieve it in OpenPAI. 

In OpenPAI, an unhealthy node-list records the nodes to be decommissioned. 
Components could sync the list and decommission them as needed.

**NOTES: For now, only YARN nodes are decommissioned, HDFS doesn't.**

## Commands

Currently, node-list update and component refresh are both manual actions. 
This tool provides corresponding command for them. 
The only mandatory argument for all commands is `master_ip`. Usually, components share the same master ip,
in different case(i.e. load-balance), you could overwrite `master_ip` separately by `--api-server-ip` and `--resource-manager-ip`.
`api-server-ip` should be the kubernetes load-balance ip in [kubernetes-configuration](../../examples/cluster-configuration/kubernetes-configuration.yaml).
`resource-manager-ip` should be the pai-master node ip of machine-list in [layout](../../examples/cluster-configuration/layout.yaml)

So, a common invoking looks like:
```bash
python node_maintain.py {master_ip} sub-command sub-command-arguments
```

Noticed that execution path should be `{PAI_ROOT_DIR}/src/tools`.

### node-list sub-command

`node-list` command could get and edit unhealthy node-list, 
notice that the change will not trigger the real refresh behavior.

* `node-list get`: print current unhealthy node-list
* `node-list add nodes`: add nodes to current node-list
* `node-list remove nodes`: remove nodes from current node-list
* `node-list update nodes`: overwrite current node-list with nodes


### refresh sub-command

Enforce the node-list, it's a blocking command and won't exit until all nodes in node-list are decommissioned.


## Scenarios

For convenience, in this section, we assume you have a cluster without load-balance, as below:
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

