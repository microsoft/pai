# Introduction
An implementation of Prometheus monitor K8s cluster metrics (GPUs, CPUs, Jobs ...).

# Getting Started

## 1. Configuration
Config monitor GPU servers:
### 1.1. config monitor which GPU nodes through Prometheus
Update prometheus-configmap.yaml file this part, change the -targets:[xxx] ip address to your GPU server IP.
(File: prometheus-configmap.yaml)
```cmd
    - job_name: "gpu_exporter"
      scrape_timeout: '50s'
      scrape_interval: "50s"
      static_configs:
      - targets: ['${EXPORTER_IP1}:${EXPORTER_PORT}', '${EXPORTER_IP1}:${EXPORTER_PORT}']
```
- Replace `${EXPORTER_IP1}, ${EXPORTER_IP2}` with the server ip that we would like to pull the exporter metrics; Replace `${EXPORTER_PORT}` with the server port which we specified for the docker registry (eg. `9092`)
***Note***: The metrics exporter will be launched as DaemonSet which will be deployed at each node. The prometheus is pull mode and will pull the targets machine's eporter metrics.

### 1.2. config deploy and access Prometheus Web portal at which node
#### 1.2.1 Label Prometheus node
```cmd
kubectl label nodes 10.0.1.5 prom=prom
```
#### 1.2.2 Config Promethues's node
(File: prometheus-deployment.yaml)
```
nodeSelector:
        prom: prom
```

## 2. Installation process
### 2.1 deploy the service
Deploy the profiling services:
```cmd
./deploy
```
### 2.2 undeploy the service
Undeploy the profiling services:
```cmd
./undeloy
```
### 2.3 change the namespace
(File: deploy.sh)
This command config the namespace monitor.
```cmd
NAMESPACE=${NAMESPACE:-monitor}
```
User could change it to other name (For example, config namespace test).
```cmd
NAMESPACE=${NAMESPACE:-test}
```
(File: undeplpy.sh)
This command config the namespace monitor, user could change to other name.
```cmd
NAMESPACE=${NAMESPACE:-monitor}
```

## 3. file function and code structure
#### 3.1 deploy.sh 
Launch all the related services and pods. Config some environment variables.
#### 3.2 undeploy.sh
Shut down and clear all the related services and pods.
#### 3.3 prometheus-deployment.yaml
Deploy the prometheus 
#### 3.4 prometheus-configmap.yaml
Config prometheus to monitor which metrics
#### 3.5 gpu-exporter-ds.yaml
Deploy gpu-exporter as a DaemonSet and will be launched at each node.


