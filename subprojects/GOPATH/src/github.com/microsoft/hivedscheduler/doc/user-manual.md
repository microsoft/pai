# <a name="UserManual">User Manual</a>

## <a name="Index">Index</a>
   - [Config](#Config)

## <a name="Config">Config</a>
### <a name="ConfigQuickStart">Config QuickStart</a>
1. Config `gpuTypes`

    **Description:**

    A `gpuType` defines a **resource unit** in all resource dimensions.

    Notes:
    1. It is like the [Azure VM Series](https://docs.microsoft.com/en-us/azure/virtual-machines/windows/sizes-gpu) or [GCP Machine Types](https://cloud.google.com/compute/docs/machine-types).
    2. Currently, the `gpuTypes` is not directly used by HivedScheduler, but it is used by [OpenPAI RestServer](https://github.com/microsoft/pai/tree/master/src/rest-server) to setup proportional Pod resource requests and limits. So, if you are not using with [OpenPAI RestServer](https://github.com/microsoft/pai/tree/master/src/rest-server), you can skip to config it.

    **Example:**

    Assume you have some `K80` nodes of the same SKU in your cluster, and you want to schedule Pods on them:

    1. Using `kubectl describe nodes` to check if these `K80` nodes have nearly the same [Allocatable Resources](https://kubernetes.io/docs/tasks/administer-cluster/reserve-compute-resources), especially for gpu, cpu, memory. If not, please fix it. Assume the aligned resources are: 4 gpus, 23 cpus, and 219GB memory.

    2. Then proportionally, each gpu request should also has ceil(23/4)=5 cpus and ceil(219/4)=54GB memory along with it, so config the `K80` `gpuType` as below:
        ```yaml
        physicalCluster:
          gpuTypes:
            K80:
              gpu: 1
              cpu: 5
              memory: 54Gi
        ```

2. Config `cellTypes`

    **Description:**

    A `cellType` defines a **resource topology** of a `gpuType`.

    Notes:
    1. `gpuTypes` are also `cellTypes`, but they are all leaf `cellTypes` which do not have internal topology anymore.

    **Example:**

    1. Using `nvidia-smi topo --matrix` to figure out the gpu topology on one above `K80` node:
        ```
                GPU0    GPU1    GPU2    GPU3    CPU Affinity
        GPU0     X      NODE    NODE    NODE    0-11
        GPU1    NODE     X      NODE    NODE    0-11
        GPU2    NODE    NODE     X      NODE    0-11
        GPU3    NODE    NODE    NODE     X      0-11
        ```

    2. These 4 gpus are equivalent under the node, so config the `K80-NODE` `cellType` as below:
        ```yaml
        physicalCluster:
          cellTypes:
            K80-NODE:
              childCellType: K80
              childCellNumber: 4
              isNodeLevel: true
        ```

    3. Assume you have 3 above `K80` nodes under the same network switch or as a pool, so config the `K80-NODE-POOL` `cellType` as below:
        ```yaml
        physicalCluster:
          cellTypes:
            K80-NODE-POOL:
              childCellType: K80-NODE
              childCellNumber: 3
        ```

3. Config `physicalCells`

    **Description:**

    A `physicalCell` defines a **resource instance**, i.e. a `cellType` instantiated by a specific set of physical devices.

    **Example:**

    1. Assume above 3 `K80` nodes have K8S node names `node1`, `node2` and `node3`, so config a `K80-NODE-POOL` `physicalCell` as below:
        ```yaml
        physicalCluster:
          physicalCells:
          - cellType: K80-NODE-POOL
            cellChildren:
            - cellAddress: node1
            - cellAddress: node2
            - cellAddress: node3
        ```

4. Config `virtualClusters`

    **Description:**

    A `virtualCluster` defines a **resource guaranteed quota** in terms of `cellTypes`.

    **Example:**

    1. Assume you want to partition above 3 `K80` nodes to 2 virtual clusters: vc1 with 1 node and vc2 with 2 nodes, so config `vc1` and `vc2` `virtualCluster` as below:
        ```yaml
        virtualClusters:
          vc1:
            virtualCells:
            - cellType: K80-NODE-POOL.K80-NODE
              cellNumber: 1
          vc2:
            virtualCells:
            - cellType: K80-NODE-POOL.K80-NODE
              cellNumber: 2
        ```
        Notes:
        1. The name of `virtualCluster` should be constrained by the [K8S naming convention](https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names).
        2. The `virtualCells.cellType` should be full qualified and should be started with a `cellType` which is explicitly referred in `physicalCells`.


### <a name="ConfigDetail">Config Detail</a>
[Detail Example](../example/config)
