# Watchdog

watchdog will check service / K8S / Node level health. It is a long running service and will continues report & record health metrics to log files.

# How to use

For example

1. Check watchdog log and find an error:

ssh watchdogPodHostIP

cd /var/log/containers

vi watchdog-xx.log

log example:

{"log":"2018-05-23 02:13:14,783 - watchdog - ERROR - container_status_not_ready{pod=\"node-exporter-xmvbz\", container=\"gpu-exporter\", hostip=\"10.151.40.133\"} 1\n","stream":"stderr","time":"2018-05-23T02:13:14.7838574Z"}

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

| Metric name           | Description                                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| pai_pod_count       | describe count of pai service like webportal, grafana, lable contains pod status like phase="running", ready="true"                        |
| pai_container_count | describe count of pai service container, like pai_pod_count, lable in pai_contain_count contains container status like state="running" |

## Node Health Metrics

| Metric name      | Description                                                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------- |
| pai_node_count | describe count of node in open pai, lable describe state of node like ready="true" and condition like disk_pressure="false" |

## K8s Health Metrics

| Metric name            | Description                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| k8s_api_server_count | use label `error` to represent status, if `error` != "ok", means k8s api server is not functioning correctly |

## K8s resource Metrics

| Metric name              | Description                                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| k8s_node_gpu_total     | Total Gpu                                                                                            |
| k8s_node_gpu_available | Total gpu count - used gpu count                                                                     |
| k8s_node_gpu_reserved  | If node is marked as unschedulable via `kubectl cordon $node` all unused gpus are deemed as reserved |

## Other Metrics

| Metric name                              | Description                                      |
| ---------------------------------------- | ------------------------------------------------ |
| process_error_log_total                | count of error/exception log                     |
| k8s_api_healthz_resp_latency_seconds | response latency from k8s api healthz page       |
| k8s_api_list_pods_latency_seconds    | response latency from listing pods from k8s api  |
| k8s_api_list_nodes_latency_seconds   | response latency from listing nodes from k8s api |

# Alerting

Alerting rules are under `[prometheus/prometheus-alert](../prometheus-alert)`, we added some basic healthcheck rules for pai service and node. You can add more alert rule by adding file `*.rules` to `prometheus/prometheus-alert` directory. Read doc from [prometheus](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/) for rule syntax reference.