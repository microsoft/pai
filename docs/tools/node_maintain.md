# node_maintain

## Overview

This [tool](../../src/tools/node_maintain.py) help you to gracefully decommission unhealthy nodes in OpenPAI. 

**NOTES: This tool should be invoked in the dev-box, under `{PAI_ROOT_DIR}/src/tools`. For now, it only supports decommissioning YARN nodes.
HDFS decommissioning might be added in the future.**

## Commands

This tool provides commands to query alerting nodes from prometheus and operate blacklist.
A common invoking looks like:
```bash
python node_maintain.py {object} {action} {arguments}
```

### Get current unhealthy GPU nodes

PAI monitors gpu healthiness and aggregate them in prometheus. You could query the bad GPUs from it in some ways:

###### 1. Query prometheus by this tool
```bash
python node_maintain.py badgpus get -m {prometheus_ip} [--prometheus-port {prometheus-port}]
```

`badgpus` command only includes one action:
* `badgpus get`: print current unhealthy gpu nodes

###### 2. Query prometheus alerts by webapp
By default the alert url is `http://{prometheus_ip}:9091/prometheus/alerts`, all alerts could be found on it.

###### 3. Get notification by alert-manager
If you configure alert-manager in [services-configuration](../../examples/cluster-configuration/services-configuration.yaml), 
you will get alert mails when unhealthy GPU found.


### Add unhealthy GPU nodes to blacklist

```bash
python node_maintain.py blacklist add -n {unhealthy_nodes} -m {api-server-ip}
```
You could find your `api-server-ip` in [kubernetes-configuration](../../examples/cluster-configuration/kubernetes-configuration.yaml).

`blacklist` command provides more operations about blacklist, including following actions.

* `blacklist get`: print current blacklist
* `blacklist add -n {nodes}`: add nodes to blacklist
* `blacklist remove -n {nodes}`: remove nodes from blacklist
* `blacklist update -n {nodes}`: overwrite current blacklist
* `blacklist enforce`: enforce service to load blacklist

### Enforce services to load latest blacklist

```bash
python node_maintain.py blacklist enforce -m {master_ip} [--api-server-ip api-server-ip] [--resource-manager-ip resource-manager-ip]
```
You could find your `api-server-ip` in [kubernetes-configuration](../../examples/cluster-configuration/kubernetes-configuration.yaml) and
`resource-manager-ip` in [layout](../../examples/cluster-configuration/layout.yaml), by default they are both `master_ip`.

Noticed that it's a blocking command and won't exit until all nodes are decommissioned or recommissioned.

## Scenarios

For convenience, in this section, we assume you have a cluster without load-balance, as below:
```
10.0.0.10 master
10.0.0.1 work-1
10.0.0.2 work-2
10.0.0.3 work-3
```

### Decommission nodes

At some point, `work-1` and `work-2` are alerted, need a graceful decommission:

##### 1. Add unhealthy node to blacklist

```bash
cd src/tools
python node_maintain.py blacklist add -n 10.0.0.1,10.0.0.2 -m 10.0.0.10 
```

##### 2. Refresh nodes

```bash
python node_maintain.py blacklist enforce -m 10.0.0.10
```

### Recommission nodes

Then if work-1 is repaired, you could recommission it to your cluster:

##### 1. Remove repaired node from blacklist

```bash
python node_maintain.py blacklist remove -n 10.0.0.1 -m 10.0.0.10 
```

##### 2. Refresh nodes

```bash
python node_maintain.py blacklist enforce -m 10.0.0.10
```

