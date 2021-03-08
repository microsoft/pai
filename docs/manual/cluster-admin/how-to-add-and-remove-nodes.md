# How to Add and Remove Nodes

OpenPAI doesn't support changing master nodes, thus, only the solution of adding/removing worker nodes is provided. You can add CPU workers, GPU workers, and other computing devices (e.g. TPU, NPU) into the cluster.

## Preparation

### Pre-checks on Nodes to Add

*Note*: If you are going to remove nodes, you can skip this section.

- To add worker nodes, please check if the nodes meet [The Worker Requirements](./installation-guide.md##installation-requirements).

- If you have configured any PV/PVC storage, please confirm the nodes meet PV's requirements. See [Confirm Worker Nodes Environment](./how-to-set-up-storage.md#confirm-environment-on-worker-nodes) for details.

- If you are going to add nodes that have been deleted before, you may need to restart docker daemon on those nodes.

### Pull & Modify Cluster Settings 

- Log in to your dev box machine and go into your dev box docker container, change directory to `/pai`. If you don't have a dev box docker container, [launch one](./basic-management-operations.md##pai-service-management-and-paictl).

  ```bash
  sudo docker exec -it <your-dev-box> bash
  cd /pai
  ```

- Use `paictl.py` to pull service config to a certain folder.

  ```bash
  ./paictl.py config pull -o <config-folder>
  ```

- Modify `<config-folder>/layout.yaml`. Add new nodes into `machine-list`, create a new `machine-sku` if necessary. Refer to [layout.yaml format](./installation-guide.md#layoutyaml-format) for schema requirements.

    *Note*: If you are going to remove nodes, you can skip this step.

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

- Modify HiveD scheduler settings in `<config-folder>/services-configuration.yaml` properly. Please refer to [How to Set up Virtual Clusters](./how-to-set-up-virtual-clusters.md) and the [Hived Scheduler Doc](https://github.com/microsoft/hivedscheduler/blob/master/doc/user-manual.md) for details.

    *Note*: If you are using Kubernetes default scheduler, you can skip this step.

## Use Paictl to Add / Remove Nodes

*Note*: All the following operations should be performed in the dev box docker container on the dev box machine.

*Note*：When removing nodes, the `layout.yaml` saved in Kubernetes will be automatically modified after the deletion is successful. We recommend backing up the `<config-folder>` in the file system of your dev box machine in case your dev box docker container stops.

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
    ./paictl.py node remove -n <node1> <node2> ...
    ```

- Start related services.

  ```bash
  ./paictl.py service start -n cluster-configuration hivedscheduler rest-server job-exporter
  ```
