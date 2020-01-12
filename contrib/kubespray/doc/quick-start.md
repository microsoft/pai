### Quick Start

#### Prepare configuration

##### Write master.csv

###### master.csv format
```
hostname(Node Name in k8s),host-ip
```
###### master.csv example
```
openpai-master-01,10.1.0.1
```
##### Write worker.csv
###### master.csv format
```
hostname(Node Name in k8s),host-ip
```
###### worker.csv example
```
openpai-001,10.0.0.1
openpai-002,10.0.0.2
openpai-003,10.0.0.3
openpai-004,10.0.0.4
```
##### Write config

```yaml
pai-version: :quick-start
user: forexample
password: forexample
```

###### start kubernetes

```shell script
/bin/bash quick-start-kubespray.sh -m /path/to/master.csv -w /path/tp/worker.csv -c /path/to/config
```

######  start OpenPAI

This script should be executed after ```start kubernetes```

```shell script
/bin/bash quick-start-service.sh
```