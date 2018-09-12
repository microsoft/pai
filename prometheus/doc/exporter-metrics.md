# Metrics collected

Some important metrics are listed below.

| Metrics Name | By | Description |
| --- | --- | --- |
| `nvidiasmi_attached_gpus` | `gpu_exporter` | number of gpu detectived by nvidiasmi |
| `nvidiasmi_utilization_gpu` | `gpu_exporter` | GPU utilization detectived by nvidiasmi |
| `nvidiasmi_utilization_memory` | `gpu_exporter` | GPU memory utilization detectiving by nvidiasmi |
| `container_GPUPerc` | `gpu_exporter` | GPU utilization by specified job container |
| `container_GPUMemPerc` | `gpu_exporter` | GPU memory utilization by specified job container |
| `container_CPUPerc` | `gpu_exporter` | CPU utilization by job detectived by docker stats |
| `container_MemUsage` | `gpu_exporter` | Memory usage by job detectived by docker stats (byte) |
| `container_MemLimit` | `gpu_exporter` | Memory limit by job detectived by docker stats (byte) |
| `container_MemPerc` | `gpu_exporter` | Memory utilization by job detectived by docker stats |
| `container_NetIn` | `gpu_exporter` | Network in traffic by job detectived by docker stats (byte) |
| `container_NetOut` | `gpu_exporter` | Network out traffic by job detectived by docker stats (byte) |
| `container_BlockIn` | `gpu_exporter` | Block io in traffic by job detectived by docker stats (byte) |
| `container_BlockOut` | `gpu_exporter` | Block io out traffic by job detectived by docker stats (byte) |
| `node_filefd_allocated` | `node_exporter` | Number of file descriptor allocated in node |
| `node_disk_read_time_ms` | `node_exporter` | Node disk read time (ms) |
| `node_disk_write_time_ms` | `node_exporter` | Node disk write time (ms) |
| `node_load1` | `node_exporter` | Node load in past 1 minute |
| `node_filesystem_free` | `node_exporter` | Node filesystem free space (byte) |
| `service_cpu_percent`| `gpu_exporter` | CPU utilization by pai service detectived by docker stats |
| `service_mem_usage_byte`| `gpu_exporter` | Memory usage by pai service  detectived by docker stats (byte) |
| `service_mem_limit_byte`| `gpu_exporter` | Memory limit by pai service detectived by docker stats (byte) |
| `service_mem_usage_percent`| `gpu_exporter` | Memory utilization by pai service detectived by docker stats |
| `service_net_in_byte`| `gpu_exporter` | Network in traffic by pai service detectived by docker stats (byte) |
| `service_net_out_byte`| `gpu_exporter` | Network out traffic by pai service detectived by docker stats (byte) |
| `service_block_in_byte`| `gpu_exporter` | Block io in traffic by pai service detectived by docker stats (byte) |
| `service_block_out_byte`| `gpu_exporter` | Block io out traffic by pai service detectived by docker stats (byte) |
