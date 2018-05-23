# Watchdog 
watchdog will check service / K8S / Node level health. It is a long running service and will continues report & record health metrics to log files.
# How to use
For example
1. Check watchdog log and find an error:

ssh watchdogPodHostIP

cd /var/log/containers

vi watchdog-xx.log 

log example:

{"log":"2018-05-23 02:13:14,783 - watchdog - ERROR - container_status_not_ready{pod=\"node-exporter-xmvbz\", container=\"gpu-exporter\",                hostip=\"10.151.40.133\"} 1\n","stream":"stderr","time":"2018-05-23T02:13:14.7838574Z"}

2. Go to 10.151.40.133 to check containers detail exception:

ssh 10.151.40.133

vi /var/log/containers/node-exporter-xmvbz_default_gpu-exporter-xxx.log

Find error:

nvidia cmd error.

# How to view watchdog logs
Operator could get these logs & metrics from watchdog container's log

1. From K8S portal

Find the watchdog pod and container logs

2. From Watchdog container log

go to k8s container log folder

cd /var/log/containers

vi watchdog-xx.log 

# Metrics
## Service Health Metrics

| Metric name| Note | 
| ---------- |  ----------- |
| cluster_pod_status_probe_not_ready_total | cluster pods' occurs readiness probe failed error, condition is not ready, total count |
| cluster_pod_status_phase_failed_total | cluster pods' phase become failed total count |
| cluster_pod_status_phase_unknown_total | cluster pods' phase become unknown total count |
| cluster_pod_container_status_not_ready_total | cluster pods' contains container status is not ready total count |
| cluster_pod_container_status_terminated_total | cluster pods' container status is terminated total count |
| cluster_pod_container_status_waiting_total | cluster pods' container status is waiting  total count |
| cluster_pod_container_status_restarted_pod_count_total | cluster pods' container restart total count |
| service_pod_status_probe_not_ready | specific pod occurs readiness probe failed error, condition is not ready, value is 1 |
| service_pod_status_phase_failed | specific pod phase is failed, value is 1 |
| service_pod_status_phase_unknown | specific pod phase become unknown, value is 1 |
| service_pod_container_status_not_ready | specific pod contains container status is not ready, value is 1 |
| service_pod_container_status_terminated | pecific pod container status is terminated total count, value is 1 |
| service_pod_container_status_waiting | specific pod container status is waiting  total count, value is 1 |
| service_pod_container_status_restart_total | specific pod's container restart total count |
| pod_status_probe_not_ready | each service occurs readiness probe failed error, condition is not ready, total count |
| pod_status_phase_failed | each service pods' phase become failed total count |
| pod_status_phase_unknown | each service pods' phase become unknown total count |
| container_status_not_ready | each service pods' contains container status is not ready total count |
| container_status_terminated | each service pods' container status is terminated total count |
| container_status_waiting | each service pods' container status is waiting  total count |
| container_status_restart_total | each service pods' container restart total count |

## K8s Health Metrics
| Metric name| Labels/tags |
| ---------- |  ----------- |
| apiserver_status_error | api server health status, 1 is error |
| etcd_status_error | etcd health status, 1 is error |
| kubelet_status_error | each node kubelet health status, 1 is error |

## Node Health Metrics
| Metric name| Labels/tags |
| ---------- |  ----------- |
| node_notready | node status, value 1 is error|
| node_notready_count | all nodes not ready count|
| node_docker_error | per node docker daemon occurs error, 1 is error |
| node_docker_error_total_count | all nodes docker occurs error node count |

