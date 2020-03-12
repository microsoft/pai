### Quick Start

#### Prepare configuration

- master.csv: machine-list of infra nodes. Infra nodes is used to deploy etcd cluster and k8s-master node (single master).
- worker.csv: machine-list of worker nodes. Worker nodes is used to deploy kubernetes worker nodes
- config: Configuration of OpenPAI service.


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
user: forexample
password: forexample
branch_name: <% latest-release %>
docker_image_tag: <% latest-release %>

# Optional

#############################################
# Ansible-playbooks' inventory hosts' vars. #
#############################################
# ssh_key_file_path: /path/to/you/key/file

#####################################
# OpenPAI's service image registry. #
#####################################
# docker_registry_domain: docker.io
# docker_registry_namespace: openpai
# docker_registry_username: exampleuser
# docker_registry_password: examplepasswd

###########################################################################################
#                         Pre-check setting                                               #
# By default, we assume your gpu environment is nvidia. So your runtime should be nvidia. #
# If you are using AMD or other environment, you should modify it.                        #
###########################################################################################
# worker_default_docker_runtime: nvidia
# docker_check: true

# resource_check: true

# gpu_type: nvidia

########################################################################################
# Advanced docker configuration. If you are not familiar with them, don't change them. #
########################################################################################
# docker_data_root: /mnt/docker
# docker_config_file_path: /etc/docker/daemon.json
# docker_iptables_enabled: false

## An obvious use case is allowing insecure-registry access to self hosted registries.
## Can be ipaddress and domain_name.
## example define 172.19.16.11 or mirror.registry.io
# openpai_docker_insecure_registries:
#   - mirror.registry.io
#   - 172.19.16.11

## Add other registry,example China registry mirror.
# openpai_docker_registry_mirrors:
#   - https://registry.docker-cn.com
#   - https://mirror.aliyuncs.com

#######################################################################
#                       kubespray setting                             #
#######################################################################

# If you couldn't access to gcr.io or docker.io, please configure it.
# gcr_image_repo: "gcr.io"
# kube_image_repo: "gcr.io/google-containers"
# quay_image_repo: "quay.io"
# docker_image_repo: "docker.io"

# openpai_kube_network_plugin: weave
```

###### start kubernetes

```shell script
/bin/bash quick-start-kubespray.sh -m /path/to/master.csv -w /path/tp/worker.csv -c /path/to/config
```

######  start OpenPAI

This script should be executed after ```start kubernetes```

```shell script
/bin/bash quick-start-service.sh -m /path/to/master.csv -w /path/tp/worker.csv -c /path/to/config
```