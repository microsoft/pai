# Dshuttle section parser

- [Dshuttle section parser](#dshuttle-section-parser)
  - [Default configuration](#default-configuration)
  - [How to configure Dshuttle section in service-configuration.yaml](#how-to-configure-dshuttle-section-in-service-configurationyaml)
  - [Generated Configuration](#generated-configuration)
  - [Table](#table)
  - [Notice](#notice)
  - [How to config DShuttle](#how-to-config-dshuttle)

## Default configuration

[Dshuttle default configuration](dshuttle.yaml)

## How to configure Dshuttle section in service-configuration.yaml

All config fields are optional. We recommend admin change the config according the cluster hardware and job demands.

- `worker_request_mem: 2G`: The dshuttle-worker requests memory, it's the total memory requests include store data and services requirement
- `worker_limit_mem: 8G`: The memory limit for dshuttle-worker. Should equal or larger than request memory and worker_max_heap_size
- `worker_max_heap_size: 4G`: The max memory consumed by java heap
- `worker_rpc_port: 4999`: Dshuttle-worker rpc port
- `worker_web_port: 5000`: Dshuttle-worker web port
- `worker_active_processor_count: 5`: activate process count, program will use this value to decide how many worker threads to be created

- `job_worker_max_heap_size: 2G`: The max memory consumed by java heap
- `job_worker_request_mem: 1G`:  The dshuttle-job-worker requests memory
- `job_worker_limit_mem: 3G` The memory limit for dshuttle-job-worker. Should equal or larger than request memory and job_worker_max_heap_size
- `job_worker_rpc_port: 5001`: Dshuttle-job-worker rpc port
- `job_worker_data_port: 5002`: Dshuttle job worker data port
- `job_worker_web_port: 5003`: Dshutte job worker port
- `job_worker_active_processor_count: 5`: activate process count, program will use this value to decide how many worker threads to be created

- `master_max_heap_size: 12G`: The max memory consumed by java heap
- `master_limit_mem: 16G`: The memory limit for dshuttle-master
- `master_request_mem: 8G`: The dshuttle-master requests memory
- `master_rpc_port: 30998`: Master rpc port
- `master_web_port: 30999`: Master web port
- `master_active_processor_count: 10`: activate process count, program will use this value to decide how many worker threads to be created


- `job_master_rpc_port: 31001`: Job master rpc port
- `job_master_web_port: 31002`: Job master web port
- `job_master_request_mem: 4G`: The dshuttle-job-master requests memory
- `job_master_limit_mem: 8G`: The memory limit for dshuttle-job-master
- `job_master_max_heap_size: 6G`: The max memory consumed by java heap
- `job_master_active_processor_count: 10`: activate process count, program will use this value to decide how many worker threads to be created


- `fuse_max_direct_mem_size: 3G`: Max java direct memory consumed by fuse. It's depends on workload, if this size is too small will cause OOM.
- `fuse_max_heap_size: 5G`: The max memory consumed by java heap
- `fuse_active_processor_count: 10`: activate process count, program will use this value to decide how many worker threads to be created
- `csi_daemon_request_mem: 4G`: The dshuttle-csi requests memory
- `csi_daemon_limit_mem: 10G`: The memory limit for dshuttle-csi

- `tieredstores`: The tired store config. The default is shown below, admin can change the tired store level and medium size according to the environment. The `watermark_high_ratio` set the high wartermark of the space in the storage tier. `watermark_low_ratio` set low watermark of the space in the storage tier. If worker contain data more than `watermark_high_ratio`, data evict starts until data space reach  `watermark_low_ratio`.
  ```yaml
  - level: 0
    mediumtype: MEM
    alias: MEM
    path: /dev/shm
    quota: 1GB
    watermark_low_ratio: 0.7
    watermark_high_ratio: 0.95
  - level: 1
    mediumtype: SSD
    alias: SSD
    path: /mnt/ssd
    quota: 100G
    watermark_low_ratio: 0.7
    watermark_high_ratio: 0.95
  ```

## Generated Configuration

After parsing, if you configured the dshuttle the model will be like:

```yaml
dshuttle:
  worker_request_mem: 2G
  worker_limit_mem: 8G
  worker_max_heap_size: 4G
  worker_rpc_port: 4999
  worker_web_port: 5000
  worker_active_processor_count: 5
  
  job_worker_max_heap_size: 2G
  job_worker_request_mem: 1G
  job_worker_limit_mem: 3G
  job_worker_rpc_port: 5001
  job_worker_data_port: 5002
  job_worker_web_port: 5003
  job_worker_active_processor_count: 5
  
  master_max_heap_size: 12G
  master_limit_mem: 16G
  master_request_mem: 8G
  master_rpc_port: 30998
  master_web_port: 30999
  master_active_processor_count: 10
  
  job_master_rpc_port: 31001
  job_master_web_port: 31002
  job_master_request_mem: 4G
  job_master_limit_mem: 8G
  job_master_max_heap_size: 6G
  job_master_active_processor_count: 10
  
  fuse_max_direct_mem_size: 3G
  fuse_max_heap_size: 5G
  fuse_active_processor_count: 10
  csi_daemon_request_mem: 4G
  csi_daemon_limit_mem: 10G
  
  tieredstores:
  - level: 0
    mediumtype: MEM,SSD
    alias: MEM
    path: /dev/shm,/mnt/ssd
    quota: 1GB,100GB
    watermark_low_ratio: 0.7
    watermark_high_ratio: 0.95
```

## Table

| Data in Configuration File             | Data in Cluster Object Model                    | Data in Jinja2 Template                                  | Data type |
|----------------------------------------|-------------------------------------------------|----------------------------------------------------------|-----------|
| dshuttle.worker_request_mem            | com["dshuttle"]["worker_request_mem"]           | cluster_cfg["dshuttle"]["worker_request_mem"]            | String    |
| dshuttle.worker_limit_mem              | com["dshuttle"]["worker_limit_mem"]             | cluster_cfg["dshuttle"]["worker_limit_mem"]              | String    |
| dshuttle.worker_max_heap_size          | com["dshuttle"]["worker_max_heap_size"]         | cluster_cfg["dshuttle"]["worker_max_heap_size"]          | String    |
| dshuttle.worker_rpc_port               | com["dshuttle"]["worker_rpc_port"]              | cluster_cfg["dshuttle"]["worker_rpc_port"]               | Number    |
| dshuttle.worker_web_port               | com["dshuttle"]["worker_web_port"]              | cluster_cfg["dshuttle"]["worker_web_port"]               | Number    |
| dshuttle.worker_active_processor_count | com["dshuttle"]["worker_active_processor_count"]| cluster_cfg["dshuttle"]["worker_active_processor_count"] | Number    |
| dshuttle.job_worker_request_mem        | com["dshuttle"]["job_worker_request_mem"]       | cluster_cfg["dshuttle"]["job_worker_request_mem"]        | String    |
| dshuttle.job_worker_limit_mem          | com["dshuttle"]["job_worker_limit_mem"]         | cluster_cfg["dshuttle"]["job_worker_limit_mem"]          | String    |
| dshuttle.job_worker_max_heap_size      | com["dshuttle"]["job_worker_max_heap_size"]     | cluster_cfg["dshuttle"]["job_worker_max_heap_size"]      | String    |
| dshuttle.job_worker_rpc_port           | com["dshuttle"]["job_worker_rpc_port"]          | cluster_cfg["dshuttle"]["job_worker_rpc_port"]           | Number    |
| dshuttle.job_worker_data_port          | com["dshuttle"]["job_worker_data_port"]         | cluster_cfg["dshuttle"]["job_worker_data_port"]          | Number    |
| dshuttle.job_worker_web_port           | com["dshuttle"]["job_worker_web_port"]          | cluster_cfg["dshuttle"]["job_worker_web_port"]           | Number    |
| dshuttle.job_worker_active_processor_count | com["dshuttle"]["job_worker_active_processor_count"]| cluster_cfg["dshuttle"]["job_worker_active_processor_count"] | Number    |
| dshuttle.master_request_mem            | com["dshuttle"]["master_request_mem"]           | cluster_cfg["dshuttle"]["master_request_mem"]            | String    |
| dshuttle.master_limit_mem              | com["dshuttle"]["master_limit_mem"]             | cluster_cfg["dshuttle"]["master_limit_mem"]              | String    |
| dshuttle.master_max_heap_size          | com["dshuttle"]["master_max_heap_size"]         | cluster_cfg["dshuttle"]["master_max_heap_size"]          | String    |
| dshuttle.master_rpc_port               | com["dshuttle"]["master_rpc_port"]              | cluster_cfg["dshuttle"]["master_rpc_port"]               | Number    |
| dshuttle.master_web_port               | com["dshuttle"]["master_web_port "]             | cluster_cfg["dshuttle"]["master_web_port"]               | Number    |
| dshuttle.master_active_processor_count | com["dshuttle"]["master_active_processor_count "] | cluster_cfg["dshuttle"]["master_active_processor_count"] | Number  |
| dshuttle.job_master_rpc_port           | com["dshuttle"]["job_master_rpc_port"]          | cluster_cfg["dshuttle"]["job_master_rpc_port"]           | Number    |
| dshuttle.job_master_web_port           | com["dshuttle"]["job_master_web_port"]          | cluster_cfg["dshuttle"]["job_master_web_port"]           | Number    |
| dshuttle.job_master_request_mem        | com["dshuttle"]["job_master_request_mem"]       | cluster_cfg["dshuttle"]["job_master_request_mem"]        | String    |
| dshuttle.job_master_limit_mem          | com["dshuttle"]["job_master_limit_mem"]         | cluster_cfg["dshuttle"]["job_master_limit_mem"]          | String    |
| dshuttle.job_master_max_heap_size      | com["dshuttle"]["job_master_max_heap_size"]     | cluster_cfg["dshuttle"]["job_master_max_heap_size"]      | String    |
| dshuttle.job_master_active_processor_count | com["dshuttle"]["job_master_active_processor_count"]| cluster_cfg["dshuttle"]["job_master_active_processor_count"] | Number    |
| dshuttle.tieredstores                  | com["dshuttle"]["tieredstores"]                 | cluster_cfg["dshuttle"]["tieredstores"]                  | Object    |
| fuse_max_direct_mem_size               | com["dshuttle"]["fuse_max_direct_mem_size"]     | cluster_cfg["dshuttle"]["fuse_max_direct_mem_size"]      | String    |
| fuse_max_heap_size                     | com["dshuttle"]["fuse_max_heap_size"]           | cluster_cfg["dshuttle"]["fuse_max_heap_size"]            | String    |
| fuse_active_processor_count            | com["dshuttle"]["fuse_active_processor_count"]  | cluster_cfg["dshuttle"]["fuse_active_processor_count"]   | Number    |
| csi_daemon_request_mem                 | com["dshuttle"]["csi_daemon_request_mem"]       | cluster_cfg["dshuttle"]["csi_daemon_request_mem"]        | String    |
| csi_daemon_limit_mem                   | com["dshuttle"]["csi_daemon_limit_mem"]         | cluster_cfg["dshuttle"]["csi_daemon_limit_mem"]          | String    |

## Notice
For `tieredstores`, the valid medium type is `MEM` and `SSD`. And the valid path is `/dev/shm` and `/mnt/ssd`
If you set medium type to `MEM`, please set path to `/dev/shm`. If you set medium type to `SSD`, please set path to `/mnt/ssd`.
Using other `mediumtype` or `path` will cause errors.

## How to config DShuttle
1. Hived configuration changes:
   If you use Hived scheduler as your default scheduler. You need to recalculate the node resource since DShuttle requests some resources in worker node. For default configuration,
   in each worker node DShuttle requests 7GB memory (3 GB for worker and 4GB for CSI client). So when you calculate the SKU for worker nodes, need to reserve this 7GB memory for DShuttle.
2. Using DShuttle as a PAI storage:
   1. Please set `dshuttle: 'true'` in `services-configuration.yaml` under `cluster:common` filed.
   2. DShuttle only support AzureBlob in current version. To use DShuttle, please make sure the you already have a azureBlob storage and mounted in DShuttle. For details, please refer [DShuttle Doc](https://github.com/microsoft/DShuttle/blob/dev/deploy/readme.md)
   3. Create PV & PVC for DShuttle storage. The `dshuttlePath` in PV should be the azureBlob mounted path in DShuttle. A sample for DShuttle PV & PVC is.
   ```yaml
    apiVersion: v1
    kind: PersistentVolume
    metadata:
      name: dshuttle-pv
    spec:
      accessModes:
      - ReadWriteMany
      capacity:
        storage: 100Gi
      csi:
        driver: dshuttle
        volumeHandle:  dshuttle
        volumeAttributes:
          dshuttlePath: /azurene
      mountOptions:
      - kernel_cache
      - allow_other
      - entry_timeout=36000
      - attr_timeout=36000
      - max_readahead=0
      persistentVolumeReclaimPolicy: Retain
      volumeMode: Filesystem
    ---
    apiVersion: v1
    kind: PersistentVolumeClaim
    metadata:
      name: dshuttle-pvc
      namespace: default
    spec:
      accessModes:
      - ReadWriteMany
      resources:
        requests:
          storage: 100Gi
      selector:
        matchExpressions:
        - key: name
          operator: In
          values:
          - dshuttle-pv
      volumeMode: Filesystem
      volumeName: dshuttle-pv
   ```