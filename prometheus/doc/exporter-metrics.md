# Metrics collected

Some important metrics are listed below.

| Metrics Name | By | Description |
| --- | --- | --- |
| `nvidiasmi_attached_gpus` | `gpu_exporter` | number of gpu detectived by nvidiasmi |
| `nvidiasmi_utilization_gpu` | `gpu_exporter` | GPU utilization detectived by nvidiasmi |
| `nvidiasmi_utilization_memory` | `gpu_exporter` | GPU memory utilization detectiving by nvidiasmi |
| `container_GPUPerc` | `gpu_exporter` | GPU utilization by specified container |
| `container_GPUMemPerc` | `gpu_exporter` | GPU memory utilization by specified container |
| `container_CPUPerc` | `gpu_exporter` | CPU utilization detectived by docker stats |
| `container_MemUsage` | `gpu_exporter` | Memory usage detectived by docker stats (byte) |
| `container_MemLimit` | `gpu_exporter` | Memory limit detectived by docker stats (byte) |
| `container_MemPerc` | `gpu_exporter` | Memory utilization detectived by docker stats |
| `container_NetIn` | `gpu_exporter` | Network in traffic detectived by docker stats (byte) |
| `container_NetOut` | `gpu_exporter` | Network out traffic detectived by docker stats (byte) |
| `container_BlockIn` | `gpu_exporter` | Block io in traffic detectived by docker stats (byte) |
| `container_BlockOut` | `gpu_exporter` | Block io out traffic detectived by docker stats (byte) |
| `node_filefd_allocated` | `node_exporter` | Number of file descriptor allocated in node |
| `node_disk_read_time_ms` | `node_exporter` | disk read time (ms) |
| `node_disk_write_time_ms` | `node_exporter` | disk write time (ms) |
| `node_load1` | `node_exporter` | node load in past 1 minute |
| `node_filesystem_free` | `node_exporter` | filesystem free space (byte) |
