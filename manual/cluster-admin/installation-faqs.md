# Installation FAQs

* <h4>How to Write Hived Scheduler Configuration for a Heterogeneous Cluster</h4>

  * CPU only

    To config CPU nodes in cluster using hived scheduler,
    you need to mock one GPU for each CPU in `gpuTypes`.
    Here's an example of a 3 CPU nodes cluster:

    ```yaml
    hivedscheduler:
    config: |
      physicalCluster:
        gpuTypes:
          CPU:
            gpu: 1
            cpu: 1
            memory: 2048Mi
        cellTypes:
          CPU-NODE:
            childCellType: CPU
            childCellNumber: 24
            isNodeLevel: true
          CPU-NODE-POOL:
            childCellType: CPU-NODE
            childCellNumber: 3
        physicalCells:
        - cellType: CPU-NODE-POOL
          cellChildren:
          - cellAddress: 192.168.0.1
          - cellAddress: 192.168.0.2
          - cellAddress: 192.168.0.3
      virtualClusters:
        default:
          virtualCells:
          - cellType: CPU-NODE-POOL
            cellNumber: 1
        cpu:
          virtualCells:
          - cellType: CPU-NODE-POOL
            cellNumber: 2
    ```

  * GPU of multiple types

    To config multiple types GPU nodes in cluster using hived scheduler,
    you need to specify all types in `gpuTypes` and config virtual clusters accordingly.
    Here's an example of 2 P100 nodes and 1 V100 node cluster:

    ```yaml
    hivedscheduler:
    config: |
      physicalCluster:
        gpuTypes:
          P100:
            gpu: 1
            cpu: 4
            memory: 8192Mi
          V100:
            gpu: 1
            cpu: 6
            memory: 12288Mi
        cellTypes:
          P100-NODE:
            childCellType: P100
            childCellNumber: 8
            isNodeLevel: true
          V100-NODE:
            childCellType: V100
            childCellNumber: 8
            isNodeLevel: true
          P100-NODE-POOL:
            childCellType: P100-NODE
            childCellNumber: 2
          V100-NODE-POOL:
            childCellType: P100-NODE
            childCellNumber: 1
        physicalCells:
        - cellType: P100-NODE-POOL
          cellChildren:
          - cellAddress: 192.168.1.1
          - cellAddress: 192.168.1.2
        - cellType: V100-NODE-POOL
          cellChildren:
          - cellAddress: 192.168.2.1
      virtualClusters:
        default:
          virtualCells:
          - cellType: P100-NODE-POOL
            cellNumber: 1
        vc1:
          virtualCells:
          - cellType: P100-NODE-POOL
            cellNumber: 1
        vc2:
          virtualCells:
          - cellType: V100-NODE-POOL
            cellNumber: 1
    ```

* <h4>Other Questions</h4>

  Please open an issue on [GitHub](https://github.com/microsoft/pai/issues).
