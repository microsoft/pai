# How to Customize Alerts

OpenPAI supports the customization of alert rules and corresponding handling actions.
The alert rules are managed by `prometheus` service and the handling actions are managed by `alert-manager` service.

In this document, we will introduce existing alerts & actions, their matching methods, and how to add new customized alerts & actions.

## Existing Alerts/Actions & How to Match Them 

### Existing Alerts

OpenPAI uses `Prometheus` to monitor system metrics.
We provide various alerts by defining rules on virtual_clusters, GPU utilization, etc.
If OpenPAI is deployed, you can then visit `your_master_ip/prometheus/alerts` to see the details of alerts, including their definition and status.

For example, `PAIJobGpuPercentLowerThan0_3For1h` alert rule is by default configured as :

``` yaml
alert: PAIJobGpuPercentLowerThan0_3For1h
expr: avg(task_gpu_percent{virtual_cluster=~"default"}) BY (job_name) < 0.3
for: 1h
```

It means that the job on virtual cluster `default` with task level average GPU percent lower than `30%` for more than `1 hour` will fire the alert `PAIJobGpuPercentLowerThan0_3For1h`.

### Existing Actions

OpenPAI uses `alert-manager` service for alert handling. We have provided so far the following actions: 
* webportal-notification: Show alerts on the home page of webportal.
* email-admin: Send emails to the assigned admin.
* email-user: Send emails to the owners of jobs.
* stop-job: Stop jobs by calling OpenPAI REST API.
* tag-job: Add a tag to a job by calling OpenPAI REST API.

`webportal-notification` is always enabled, which means that all the alerts will be shown on the webportal.

All the other actions are realized in `alert-handler`.
To make these actions available, administrators need to properly fill the corresponding fields of `alert-manager` in `service-configuration.yml`, 
the available actions list will then be saved in `cluster_cfg["alert-manager"]["actions-available"]`, please refer to [alert-manager config](https://github.com/suiguoxin/pai/tree/prometheus/src/alert-manager/config/alert-manager.md) for details of alert-manager service configuration details.

These actions can be called within `alert-manager` by sending POST requests to `alert-handler`:
- `localhost:{your_alert_handler_port}/alert-handler/send-email-to-admin`
- `localhost:{your_alert_handler_port}/alert-handler/send-email-to-user`
- `localhost:{your_alert_handler_port}/alert-handler/stop-job`
- `localhost:{your_alert_handler_port}/alert-handler/tag-job/:tag`

The request body will be automatically filled by `alert-manager` with `webhook`
and `alert-handler` will adapt the requests to various actions.

Notice that when `email-user` is called, `alert-handler` will :
1. check if `job_name` exists in the alert body;
2. find the job owner with `job_name`;
3. check if the owner has an email address.

Make sure `job_name` presents in the alert body if you want to use this action.


### How to Match Alerts and Actions

The matching rules between alerts and actions are defined in [alert-manager-configmap.yaml.template](https://github.com/microsoft/pai/blob/master/src/alert-manager/deploy/alert-manager-configmap.yaml.template):

``` yaml
kind: ConfigMap
apiVersion: v1
metadata:
  name: alertmanager
data:
  config.yml: |-
    global:
      resolve_timeout: 5m
{% set alert_handler = cluster_cfg["alert-manager"]["alert-handler"] %}
    route:
      receiver: pai-email-admin
      group_wait: 30s
      group_interval: 5m
      repeat_interval: {{ cluster_cfg["alert-manager"]["repeat-interval"] }}
      group_by: [alertname, alertstate]
      routes:
      - receiver: pai-email-admin-user-and-stop-job
        match: 
          alertname: PAIJobGpuPercentLowerThan0_3For1h
    receivers:
    - name: "pai-email-admin"
      webhook_configs:
{% if 'email-admin' in cluster_cfg["alert-manager"]["actions-available"] %}
       - url: 'http://localhost:{{ alert_handler["port"] }}/alert-handler/send-email-to-admin'
         send_resolved: true
{% endif %}
    - name: "pai-email-admin-user-and-stop-job"
      webhook_configs:
{% if 'email-admin' in cluster_cfg["alert-manager"]["actions-available"] %}
        - url: 'http://localhost:{{ alert_handler["port"] }}/alert-handler/send-email-to-admin'
          send_resolved: true
{% endif %}
{% if 'email-user' in cluster_cfg["alert-manager"]["actions-available"] %}
        - url: 'http://localhost:{{ alert_handler["port"] }}/alert-handler/send-email-to-user'
          send_resolved: true
          http_config:
            bearer_token: {{ alert_handler["pai-bearer-token"] }}
{% endif %}
{% if 'stop-job' in cluster_cfg["alert-manager"]["actions-available"] %}
#       - url: 'http://localhost:{{ alert_handler["port"] }}/alert-handler/stop-job'
#         send_resolved: false
#         http_config:
#           bearer_token: {{ alert_handler["pai-bearer-token"] }}
#       - url: 'http://localhost:{{ alert_handler["port"] }}/alert-handler/tag-job/stopped-by-alert-manager'
#         send_resolved: false
#         http_config:
#           bearer_token: {{ alert_handler["pai-bearer-token"] }}
{% endif %}

{% endif %}
```

Suppose all the actions are available and the `if` clauses are all evaluated as `True`.
Then, in this example, as defined in the `route` filed, most alerts will be handled by the default receiver : `pai-email-admin`, which will call only `email-admin` action.

The alert `PAIJobGpuPercentLowerThan0_3For1h` will be handled by `pai-email-admin-user-and-stop-job` receiver. 
Under `pai-email-admin-user-and-stop-job` receiver, the email action is by default enabled.
Note thant `email-user` action can only be triggered when `job-name` exists in the alert body.
If you uncomment the last several lines for `stop-job` and `tag-job` action, when the `PAIJobGpuPercentLowerThan0_3For1h` alert is fired,  the `stop-job` action will also be triggered and a `stopped-by-alert-handler` tag will be added to the job.

You are free to add new receivers with related matching rules to assign actions to alerts.

Restart the `alert-manager` service after your modification.

For alert & action matching rules syntax, please refer to [Prometheus Alertmanager](https://prometheus.io/docs/alerting/latest/configuration/).

For OpenPAI service management, please refer to [Basic Management Operations](https://github.com/microsoft/pai/blob/master/docs/manual/cluster-admin/basic-management-operations.md).


## How to Customize Alerts

All the alert rules are defined in [this folder](https://github.com/microsoft/pai/blob/master/src/prometheus/deploy/alerting).
If you want to change the default values of some fields of these rules, modify the corresponding `.rules` files.
You can also add new rules by using various system metrics, feel free to add a `.rules` file in the folder if you need it.
You can explore the metrics at `your_master_ip/prometheus/graph`.

Restart the `prometheus` service after your modification. 

For alerting rules syntax, please refer to [link](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/).

## How to Add New Actions

If you want to add new customized actions, you are encouraged to realize that through `alert-handler`.
We provide `alert-handler` as a lightweight `express` application, where you can add customized APIs easily.

For example, the `stop-job` action is realized by calling the `localhost:9095/alert-handler/stop-job` API through `webhook`, the request is then forward to the OpenPAI Rest Server to stop the job. You can add new APIs in `alert-handler` and adapt the request realize the required action.

The source code of `alert-handler` is available [here](https://github.com/microsoft/pai/blob/master/src/alert-manager/src).
Remember to re-build and push the docker image, and restart the `alert-manager` service after your modification.
