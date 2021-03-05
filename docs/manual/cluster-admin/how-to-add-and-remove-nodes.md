# How to Add and Remove Nodes

OpenPAI doesn't support changing master nodes, thus, only the solution of adding/removing worker nodes is provided. You can add CPU workers, GPU workers, and other computing devices (e.g. TPU, NPU) into the cluster.

## Preparation

### On Nodes to Add

If you are going to remove nodes, you can skip this section.

- To add worker nodes, please check if the nodes meet [The Worker Requirements](./installation-guide.md##installation-requirements).

- If you have configured any PV/PVC storage, please confirm the added worker node meets the PV's requirements. See [Confirm Worker Nodes Environment](./how-to-set-up-storage.md#confirm-environment-on-worker-nodes) for details.

- You may need to change docker daemon config and restart docker daemon on those nodes.

### On Dev Machine

- Find your [service configuration file `layout.yaml` and `services-configuration.yaml`](./basic-management-operations.md#pai-service-management-and-paictl) in  `<config-folder>`.

- Modify `layout.yaml`. Refer to [layout.yaml format](./installation-guide.md#layoutyaml-format) for schema requirements.

  - If you are going to add nodes, add new nodes into `machine-list`, create a new `machine-sku` if necessary.

    ```yaml
    machine-list:
      - hostname: new-worker-node--0
        hostip: x.x.x.x
        machine-type: xxx-sku
        pai-worker: "true"

      - hostname: new-worker-node-1
        hostip: x.x.x.x
        machine-type: xxx-sku
        pai-worker: "true"
    ```
  
  - If you are going to remove nodes, remove nodes from `machine-list`, delete the empty `machine-sku` if necessary.

- If you are using hived scheduler, you should modify its settings in `services-configuration.yaml` properly. Please refer to [How to Set up Virtual Clusters](./how-to-set-up-virtual-clusters.md) and the [Hived Scheduler Doc](https://github.com/microsoft/hivedscheduler/blob/master/doc/user-manual.md) for details. If you are using Kubernetes default scheduler, you can skip this step.

## Use Paictl to Add / Remove Nodes

- Log in to your dev box machine and go into your dev box docker container. If you don't have a dev box docker container, [launch one](./basic-management-operations.md##pai-service-management-and-paictl).

  ```bash
  sudo docker exec -it <your-dev-box> bash
  ```

- Stop related services.

  ```bash
  ./paictl.py service stop -n cluster-configuration hivedscheduler rest-server job-exporter
  ```

- Push the latest configuration.

  ```bash
  ./paictl.py config push -p <config-folder> -m service
  ```

- Add nodes to and/or remove nodes from kubernetes.

  - To add nodes:


    ```bash  
    ./paictl.py node add -n <node1> <node2> ...
    ```

  - To remove nodes:


    ```bash  
    ./paictl.py node add -n <node1> <node2> ...
    ```

- Start related services.

  ```bash
  ./paictl.py service start -n cluster-configuration hivedscheduler rest-server job-exporter
  ```
