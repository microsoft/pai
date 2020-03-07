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
branch-name: <% latest-release %>
docker-image-tag: <% latest-release %>
user: forexample
password: forexample

# Optional

#####################################
# OpenPAI's service image registry. #
#####################################
# docker-registry-domain: docker.io
# docker-registry-namespace: openpai
# docker-registry-username: exampleuser
# docker-registry-password: examplepasswd

###########################################################################################
# By default, we assume your gpu environment is nvidia. So your runtime should be nvidia. #
# If you are using AMD or other environment, you should modify it.                        #
###########################################################################################
# worker-default-docker-runtime: nvidia

########################################################################################
# Advanced docker configuration. If you are not familiar with them, don't change them. #
########################################################################################
# docker-data-root: /mnt/docker
# docker-config-file-path: /etc/docker/daemon.json
# docker-iptables-enabled: false

#######################################################################
# If you couldn't access to gcr.io or docker.io, please configure it. #
#######################################################################
# gcr-image-repo: "gcr.io"
# kube-image-repo: "gcr.io/google-containers"
# quay-image-repo: "quay.io"
# docker-image-repo: "docker.io"
```

###### Check environment requirement

```shell script
/bin/bash requirement.sh -m /path/to/master.csv -w /path/tp/worker.csv -c /path/to/config
```
