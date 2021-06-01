# 1. Introduction

Autoscaler is an independent tool to monitor the status of your PAI cluster and adjust the cluster size as needed. It will take into account the three levels of application (PAI, ITP, etc.), infrastructure (K8s), and cloud VM (Azure, AWS, Aliyun, etc.) at the same time.

We have built a general auto scaler structure, defined abstract classes for each part, and provided a default `OpenPaiSimpleScaler` for common use. If you are running a K8s-based PAI cluster on Azure VMs, just go through [Quick Start](#2-quick-start).

# 2. Quick Start

- Create your config file:

    ```bash
    cp config_example.yaml config.yaml
    vim config.yaml
    ```

- Fill in necessary information about your PAI cluster:

    ```json
    pai_rest_server_uri: <URL to Your OpenPAI Rest Server>
    pai_bearer_token: <Bearer Token to Access Your OpenPAI Service>
    ```

- Start Autoscaler in the background:

    ```bash
    python3 autoscaler.py &!
    ```

# 3. Structure

## 3.1 Scaler

Scaler is the entrance and the core part of Autoscaler. Every once in a while, the scaler will:

1. Call monitors to fetch latest information about the cluster.
2. Tag nodes to be turn on (off) according to latest information.
3. Call operators to turn on (off) the tagged nodes.

To implement a new scaler, you can refer to following steps:

1. Inherit class `ScalerBase`.
2. Specify `time_interval` and `logger`.
3. Create and introduce `app_monitor`, `infr_monitor`, and `cloud_monitor` respectively.
4. Create two operators `infr_operator` and `cloud_operator` to turn on (off) nodes in the infrastructure and cloud VM levels respectively.
5. Write your own scale strategy into `_tag_nodes()` method.
6. Write `_before_scaling()` and `_after_scaling()` methods if necessary.

## 3.2 Monitor

### 3.2.1 App Montinor

App monitor watches vitual clusters (VCs) on the application level. Each time it is called, it will fetch and cache the latest information through corresponding API. The information we expect it to get includes: whether each VC is full, whether each VC is guaranteed, etc.

We have provided a basic app monitor for PAI. To improve it or create app monitors for other applications, you can refer to following steps:

1. Inherit class `AppMonitor`.
2. Write your own `_update_vc()` method to fetch and cache the latest information of vitual clusters from corresponding API.
3. Add new properties to the `node.VirtualCluster` class if necessary.

### 3.2.2 Infrastructure Monitor

Infrastructure monitor is responsible to watch nodes and pods on the K8s cluster. Each time on call, it gets node information and then pod information through K8s API.

So far, we do not support the creation of new infrastructure monitors.

### 3.2.3 Cloud Monnitor

Cloud Monitor records node information that can only be seen on the cloud service as a supplement. Each time on call, it get basic node information from the infrustructure monitor and then use cloud information to update it. Notice that the cloud monitor is the direct interface for the scaler to get node information, which means it is better not to modify the original K8s information in the cloud monitor.

We have provided a basic cloud monitor for Azure. To improve it or create app monitors for other applications, you can refer to following steps:

1. Inherit class `CloudMonitor`.
2. Write your own `_update_nodes()` method to update node information stored in `self._nodes`. Be careful not to delete the original information K8s information.
3. Add new properties to the `node.WorkerNode` class if necessary.

## 3.3 Operator

Operators execute node operations through linux shell. A complete Autoscaler has at least two operators to execute four different operations:

- Allocate nodes on the cloud service.
- Deallocate nodes on the cloud service.
- Cordon nodes on the K8s cluster.
- Uncordon nodes on the K8s cluster.

We have provided a `K8SCordonOperator` and an `AzureAllocateOperator`. To implement new operators for other cloud services, you can refer to following steps:

1. Inherit class `Operator`.
2. Write your own `_turn_on()` and `_turn_off()` methods to start and stop nodes on the cloud service using corresponding commands on linux shell.
