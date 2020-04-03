# How to use CPU Nodes

1. [Installation Guide](./installation-guide.md)
2. [Installation FAQs and Troubleshooting](./installation-faqs-and-troubleshooting.md)
3. [Basic Management Operations](./basic-management-operations.md)
4. [How to Manage Users and Groups](./how-to-manage-users-and-groups.md)
5. [How to Setup Kubernetes Persistent Volumes as Storage](./how-to-set-up-pv-storage.md)
6. [How to Set Up Virtual Clusters](./how-to-set-up-virtual-clusters.md)
7. [How to Add and Remove Nodes](./how-to-add-and-remove-nodes.md)
8. [How to use CPU Nodes](./how-to-use-cpu-nodes.md) (this document)
    - [How to Add CPU Nodes and Set Up CPU-only VC](#how-to-add-cpu-nodes-and-set-up-cpu-only-vc)
    - [Submit CPU-only Jobs](#submit-cpu-only-jobs)
9. [How to Customize Cluster by Plugins](./how-to-customize-cluster-by-plugins.md)
10. [Troubleshooting](./troubleshooting.md)
11. [How to Uninstall OpenPAI](./how-to-uninstall-openpai.md)
12. [Upgrade Guide](./upgrade-guide.md)

## How to Add CPU Nodes and Set Up CPU-only VC

In current release, support for CPU nodes is limited. The [installation guide](./installation-guide.md) won't work if you only have CPU worker nodes. However, after you set up the cluster with GPU worker nodes, you can add CPU worker nodes and CPU-only virtual cluster. This section is a detailed guide.

Adding CPU nodes is not much differnt from adding GPU nodes, as we have decribed in [How to Add and Remove Nodes](./how-to-add-and-remove-nodes.md). So you can follow that document basically. Meanwhile, there are two differences for CPU-only nodes:

  - In the preparation phase, you don't need to check GPU driver and Nvidia docker runtime.
  - In the hived scheduler setting, you should omit `gpu` field or use `gpu: 0` in `skuTypes` for your CPU-only VCs. Don't mix CPU nodes with GPU nodes. Here is an example:

  ```yaml
  hivedscheduler:
  config: |
    physicalCluster:
      skuTypes:
        K80:
          gpu: 1
          cpu: 5
          memory: 56334Mi
        CPU:
          cpu: 1
          memory: 10240Mi
      cellTypes:
        K80-NODE:
          childCellType: K80
          childCellNumber: 4
          isNodeLevel: true
        K80-NODE-POOL:
          childCellType: K80-NODE
          childCellNumber: 2
        CPU-NODE:
          childCellType: CPU
          childCellNumber: 8
          isNodeLevel: true
        CPU-NODE-POOL:
          childCellType: CPU-NODE
          childCellNumber: 1
      physicalCells:
      - cellType: K80-NODE-POOL
        cellChildren:
        - cellAddress: k80-worker1
        - cellAddress: k80-worker1
      - cellType: FAKE-NODE-POOL
        cellChildren:
        - cellAddress: cpu-worker1
    virtualClusters:
      default:
        virtualCells:
        - cellType: K80-NODE-POOL.K80-NODE
          cellNumber: 2
      cpu:
        virtualCells:
        - cellType: CPU-NODE-POOL.CPU-NODE
          cellNumber: 1
  ```

  Explanation of the above example: Supposing we have a node named `cpu-worker1` in Kubernetes. It has 80GB memory and 8 allocatable CPUs (please use `kubectl describe cpu-worker1` to confirm the allocatable resources). Then, in `skuTypes`, we can set a `CPU` sku, which has 1 CPU and 10240 MB (80GB / 8) memory. You can reserve some memory or CPUs if you want. `CPU-NODE` and `CPU-NODE-POOL` are set correspondingly in the `cellTypes`. Finally, the setting will result in one `default` VC and one `cpu` VC. The `cpu` VC contains one CPU node.


## Submit CPU-only Jobs

If you want to submit a CPU-only job, please submit it directly to the CPU-only VC. A special requirement is that, you should use exactly same GPU number as the CPU number you want. For example, if you want to use 8 CPUs, you should set 8 GPUs and 8 CPUs as follows:

  <img src="./imgs/cpu-resource.png" width="60%" height="60%" />

This requirement may be fixed in the future.