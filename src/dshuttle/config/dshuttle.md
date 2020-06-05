# Dshuttle section parser

- [Default Configuration](#Default-configuration-)
- [How to Configure](#How-to-configure-dshuttle-section-in-service-configurationyaml-)
- [Generated Configuration](#Generated-configuration-)
- [Data Table](#Table-)
- [Notice](#Notice-)

## Default configuration

[Dshuttle default configuration](dshuttle.yaml)

## How to configure Dshuttle section in service-configuration.yaml

All config fields are optional. We recommend admin change the config according the cluster hardware and job demands.

- `worker_request_mem: 2G` The dshuttle-worker requests memory, it's the total memory requests include store data and services requirement
- `worker_limit_mem: 4G` The memory limit for dshuttle-worker. Should equal or larger than request memory. If dshuttle-worker request more memory than limit, it will be killed.
- `worker_rpc_port: 4999`: Dshuttle-worker rpc port
- `worker_web_port: 5000`: Dshuttle-worker web port
- `job_worker_rpc_port: 5001`: Dshuttle-job-worker rpc port
- `job_worker_data_port: 5002`: Dshuttle job worker data port
- `job_worker_web_port: 5003`: Dshutte job worker port

- `master_rpc_port: 30998`: Master rpc port
- `master_web_port: 30999`: Master web port
- `master_job_rpc_port: 31001` Master job rpc port
- `master_job_web_port: 31002` Master job web port
- `user_meta_sync_interval_ms`: Meta data TTL, default is 1800000 # 30 mins

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
  worker_limit_mem: 4G
  worker_rpc_port: 4999
  worker_web_port: 5000
  job_worker_rpc_port: 5001
  job_worker_data_port: 5002
  job_worker_web_port: 5003

  master_rpc_port: 30998
  master_web_port: 30999
  master_job_rpc_port: 31001
  master_job_web_port: 31002

  user_meta_sync_interval_ms: 1800000 # 30 mins

  tieredstores:
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

## Table

| Data in Configuration File             | Data in Cluster Object Model                  | Data in Jinja2 Template                                | Data type |
|----------------------------------------|-----------------------------------------------|--------------------------------------------------------|-----------|
| dshuttle.worker_request_mem            | com["dshuttle"]["worker_request_mem"]         | cluster_cfg["dshuttle"]["worker_request_mem"]          | String    |
| dshuttle.worker_limit_mem              | com["dshuttle"]["worker_limit_mem"]           | cluster_cfg["dshuttle"]["worker_limit_mem"]            | String    |
| dshuttle.worker_rpc_port               | com["dshuttle"]["worker_rpc_port"]            | cluster_cfg["dshuttle"]["worker_rpc_port"]             | Number    |
| dshuttle.worker_web_port               | com["dshuttle"]["worker_web_port"]            | cluster_cfg["dshuttle"]["worker_web_port"]             | Number    |
| dshuttle.job_worker_rpc_port           | com["dshuttle"]["job_worker_rpc_port"]        | cluster_cfg["dshuttle"]["job_worker_rpc_port"]         | Number    |
| dshuttle.job_worker_data_port          | com["dshuttle"]["job_worker_data_port"]       | cluster_cfg["dshuttle"]["job_worker_data_port"]        | Number    |
| dshuttle.job_worker_web_port           | com["dshuttle"]["job_worker_web_port"]        | cluster_cfg["dshuttle"]["job_worker_web_port"]         | Number    |
| dshuttle.master_rpc_port               | com["dshuttle"]["master_rpc_port"]            | cluster_cfg["dshuttle"]["master_rpc_port"]             | Number    |
| dshuttle.master_web_port               | com["dshuttle"]["master_web_port "]           | cluster_cfg["dshuttle"]["master_web_port"]             | Number    |
| dshuttle.master_job_rpc_port           | com["dshuttle"]["master_job_rpc_port"]        | cluster_cfg["dshuttle"]["master_job_rpc_port"]         | Number    |
| dshuttle. master_job_web_port          | com["dshuttle"]["master_job_web_port"]        | cluster_cfg["dshuttle"]["master_job_web_port"]         | Number    |
| dshuttle. user_meta_sync_interval_ms   | com["dshuttle"]["user_meta_sync_interval_ms"] | cluster_cfg["dshuttle"]["user_meta_sync_interval_ms"]  | Number    |
| dshuttle. tieredstores                  | com["dshuttle"]["tieredstores"]              | cluster_cfg["dshuttle"]["tieredstores"]                | Object    |
