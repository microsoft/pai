# node_maintain

Graceful decommissioning could minimize the impact on existing job when remove unhealthy nodes. 
This is a tool to help you achieve it in OpenPAI. 

**NOTES: This tool only decommission node in YARN, HDFS will not be decommissioned.**



### Decommission nodes

Assume you have a cluster as below:
```
10.0.0.1 master
10.0.0.2 work-1
10.0.0.3 work-2
10.0.0.3 work-3
```

At some point, `work-1` and `work-2` encounter hardware issues, you want to gracefully decommission them.

##### 1. Edit the node list

```bash
python node_maintain.py {master_ip} node-list add 10.0.0.2,10.0.0.3
```

##### 2. Refresh nodes

```bash
python node_maintain.py {master_ip} refresh
```

### Recommission nodes

Then if work-1 is repaired, you could recommission it.

##### 1. Edit the node list

```bash
python node_maintain.py {master_ip} node-list remove 10.0.0.2
```

##### 2. Refresh nodes

```bash
python node_maintain.py {master_ip} refresh
```

