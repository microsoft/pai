# How to Customize Alerts

OpenPAI supports the customization of alert rules and corresponding handling actions.
The alert rules are managed by `prometheus` service and the matching rules between rules and actions are managed by `alert-manager` service.

In this document, we will introduce existing alerts & actions, their matching methods, and how to add new customized alerts & actions.

## Existing Alerts/Actions & How to Match Them 

### Existing Alerts

OpenPAI uses `Prometheus` to monitor system metrics.
We provide various alerts by defining rules on virtual_clusters, GPU utilization, etc.
If OpenPAI is deployed, you can then visit `your_master_ip/prometheus/alerts` to see the details of alerts, including their definitions and status.

For alerting rules syntax, please refer to [link](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/).

### Existing Actions

OpenPAI uses the `alert-manager` service for alert handling. We have provided so far these following actions: 
* webportal-notification: Show alerts on the home page of webportal.
* email-admin: Send emails to the assigned admin.
* email-user: Send emails to the owners of jobs.
* stop-jobs Stop jobs by calling OpenPAI REST API.
* tag-jobs: Add a tag to jobs by calling OpenPAI REST API.

The action `webportal-notification` is always enabled, which means that all the alerts will be shown on the webportal.

All the other actions are realized in `alert-handler`.
To make these actions available, administrators need to properly fill the corresponding fields of `alert-manager` in `service-configuration.yml`, 
the available actions list will then be saved in `cluster_cfg["alert-manager"]["actions-available"]`, please refer to [alert-manager config](https://github.com/suiguoxin/pai/tree/prometheus/src/alert-manager/config/alert-manager.md) for details of alert-manager service configuration details.

Make sure `job_name` presents in the alert body if you want to use `email-user`, `stop-jobs`, or `tag-jobs` actions.

### How to Match Alerts and Actions

The matching rules are defined using `receivers` and `rules`.
A `receiver` is simply a group of actions, a `rule` matches the alerts to a specific `receiver`. 

With the default configuration, all the alerts will match the default alert receiver which triggers only `email-admin` action.
You can add new receivers with related matching rules to assign actions to alerts in the `alert-manager` field in `service-configuration.yml`

For example :

``` yaml
customized-routes:
  routes:
  - receiver: pai-email-admin-user-and-stop-job
    match:
      alertname: PAIJobGpuPercentLowerThan0_3For1h
customized-receivers:
  - name: "pai-email-admin-user-and-stop-job"
    actions: 
      - email-admin
      - email-user
      - stop-jobs
      - tag-jobs
    tags: 
      - 'stopped-by-alert-manager'
```

Here we define :
- a receiver `pai-email-admin-user-and-stop-job`, which contains the actions `email-admin`, `email-user`, `stop-jobs` and `tag-jobs`
- a route, which matches the alert `pai-email-admin-user-and-stop-job` to the receiver `pai-email-admin-user-and-stop-job`.

As a consequence, when the alert `PAIJobGpuPercentLowerThan0_3For1h` is fired, all these 4 actions will be triggered.

For `routes` definition, we adopt the syntax of [Prometheus Alertmanager](https://prometheus.io/docs/alerting/latest/configuration/).
For `receivers` definition, you can simply:
- name the receiver in `name` field;
- list the actions to use in `actions`;
- list the tags in `tags` if `tag-jobs` is one of the actions.

Remember to push service config to the cluster and restart the `alert-manager` service after your modification. 

For alert & action matching rules syntax, please refer to [Prometheus Alertmanager](https://prometheus.io/docs/alerting/latest/configuration/).

For OpenPAI service management, please refer to [Basic Management Operations](https://github.com/microsoft/pai/blob/master/docs/manual/cluster-admin/basic-management-operations.md).


## How to Add Customized Alerts

You can define customized alerts in the `prometheus` field in `service-configuration.yml`.
For example, We can add a customized alert `PAIJobGpuPercentLowerThan0_3For1h` by adding :

``` yaml
customized-alerts: |
  groups:
    - name: customized-alerts
      rules:
        - alert: PAIJobGpuPercentLowerThan0_3For1h
          expr: avg(task_gpu_percent{virtual_cluster=~"default"}) by (job_name) < 0.3
          for: 1h
          annotations:
            summary: "{{$labels.job_name}} has a job gpu percent lower than 30% for 1 hour"
            description: Monitor job level gpu utilization in certain virtual clusters.
```

The `PAIJobGpuPercentLowerThan0_3For1h` alert will be fired when the job on virtual cluster `default` has a task level average GPU percent lower than `30%` for more than `1 hour`.
Here the metric `task_gpu_percent` is used, which describes the GPU utilization in task level. 
You can explore the system metrics at `your_master_ip/prometheus/graph`.

Remember to push service config to the cluster and restart the `prometheus` service after your modification. 

Please refer to [Prometheus Alerting Rules](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/) for alerting rules syntax.

## How to Add Customized Actions

If you want to add new customized actions, follow these steps:

###  Realize the action in 'alert-handler'.
We provide `alert-handler` as a lightweight `express` application, where you can add customized APIs easily.

For example, the `stop-jobs` action is realized by calling the `localhost:9095/alert-handler/stop-jobs` API through `webhook`,
the request is then forward to the OpenPAI Rest Server to stop the job.
You can add new APIs in `alert-handler` and adapt the request to realize the required action.

The source code of `alert-handler` is available [here](https://github.com/microsoft/pai/blob/master/src/alert-manager/src/alert-handler).

### Check the dependencies of the action

As stated before, to make an action available, administrators need to provide the necessary configurations.
Check this [folder](https://github.com/suiguoxin/pai/tree/prometheus/src/alert-manager/config) and define the dependencies' rules for your customized actions.


### Render the action to webhook configurations

When customized receivers are defined in `service-configuration.yml`,
the `actions` will then be rendered as webhook_configs [here](https://github.com/microsoft/pai/blob/master/src/alert-manager/deploy/alert-manager-configmap.yaml.template).

The actions we provide, `email-admin`, `email-user`, `stop-jobs`, `tag-jobs`, can be called within `alert-manager` by sending POST requests to `alert-handler`:
- `localhost:{your_alert_handler_port}/alert-handler/send-email-to-admin`
- `localhost:{your_alert_handler_port}/alert-handler/send-email-to-user`
- `localhost:{your_alert_handler_port}/alert-handler/stop-jobs`
- `localhost:{your_alert_handler_port}/alert-handler/tag-jobs/:tag`

The request body will be automatically filled by `alert-manager` with `webhook`
and `alert-handler` will adapt the requests to various actions.

Please define how to render your customized action to the `alert-handler` API request
[here](https://github.com/microsoft/pai/blob/master/src/alert-manager/src/alert-handler)

Remember to re-build and push the docker image, and restart the `alert-manager` service after your modification.
