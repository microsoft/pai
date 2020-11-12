# How to Use Alert System

OpenPAI has a built-in alert system. The alert system has some existing alert rules and actions. It can also let admin customize them. In this document, we will have a detailed introduction to this topic.

## Alert Rules

OpenPAI uses [`Prometheus`](https://prometheus.io/) to monitor system metrics, e.g. memory usage, disk usage, GPU usage, and so on. Using the metrics, we can set up several alert rules. The alert rules define some alert conditions and are also configured in Prometheus. When a certain condition is fulfilled, Prometheus will send a corresponding alert.

For example, the following configuration is the pre-defined `GpuUsedByExternalProcess` alert. It uses the metric `gpu_used_by_external_process_count`. If an external process using the GPU resource in OpenPAI over 5 minutes, Prometheus will fire a `GpuUsedByExternalProcess` alert.

``` yaml
alert: GpuUsedByExternalProcess
expr: gpu_used_by_external_process_count > 0
for: 5m
annotations:
  summary: found nvidia used by external process in {{$labels.instance}}
```

For the detailed syntax of alert rules, please refer to [here](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/).

All alerts fired by the alert rules, including the pre-defined rules and the customized rules, will be shown on the home page of Webportal (on the top-right corner).

### Existing Alert Rules

By default, OpenPAI provides you with a lot of metrics and some pre-defined alert rules. You can go to `http(s)://<your master IP>/prometheus/graph` to explore different metrics. Some frequently-used metrics include:

  - `task_gpu_percent`: GPU usage percent for a single task in OpenPAI jobs
  - `task_cpu_percent`: CPU usage percent for a single task in OpenPAI jobs
  - `node_memory_MemTotal_bytes`: Total memory amount in bytes for nodes
  - `node_memory_MemAvailable_bytes`: Available memory amount in bytes for nodes

To view existing alert rules based on the metrics, you can go to `http(s)://<your master IP>/prometheus/alerts`, which includes their definitions and status.

### How to Add Customized Alerts

You can define customized alerts in the `prometheus` field in [`services-configuration.yml`](./basic-management-operations.md#pai-service-management-and-paictl).
For example, We can add a customized alert `PAIJobGpuPercentLowerThan0_3For1h` by adding:

``` yaml
prometheus:
  customized-alerts: |
    groups:
    - name: customized-alerts
      rules:
      - alert: PAIJobGpuPercentLowerThan0_3For1h
        expr: avg(task_gpu_percent{virtual_cluster=~"default"}) by (job_name) < 0.3
        for: 1h
        labels:
          severity: warn
        annotations:
          summary: "{{$labels.job_name}} has a job gpu percent lower than 30% for 1 hour"
          description: Monitor job level gpu utilization in certain virtual clusters.
```

The `PAIJobGpuPercentLowerThan0_3For1h` alert will be fired when the job on virtual cluster `default` has a task level average GPU percent lower than `30%` for more than `1 hour`.
The alert severity can be defined as `info`, `warn`, `error` or `fatal` by adding a label.
Here we use `warn`.
Here the metric `task_gpu_percent` is used, which describes the GPU utilization at task level. 

Remember to push service config to the cluster and restart the `prometheus` service after your modification with the following commands [in the dev-box container](./basic-management-operations.md#pai-service-management-and-paictl):
```bash
./paictl.py service stop -n prometheus
./paictl.py config push -p /cluster-configuration -m service
./paictl.py service start -n prometheus
```

Please refer to [Prometheus Alerting Rules](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/) for alerting rule syntax.

## Alert Actions and Routes

Admin can choose how to handle the alerts by different alert actions. We provide some basic alert actions and you can also customize your own actions. In this section, we will first introduce the existing actions and the matching rules between these actions and alerts. Then we will let you know how to add new alert actions. The actions and matching rules are both handled by [`alert-manager`](https://prometheus.io/docs/alerting/latest/alertmanager/).

### Existing Actions and Matching Rules

The alert actions and the matching rules are realized in the `alert-manager` service. To define them, you should modify the `alert-manager` field in [`services-configuration.yml`](./basic-management-operations.md#pai-service-management-and-paictl). The full spec of the configuration is as follows:

```yaml
alert-manager:
  port: 9093 # optional, do not change this if you do not want to change the port alert-manager is listening on
  alert-handler:
    port: 9095 # optional, do not change this if you do not want to change the port alert-handler is listening on
    pai-bearer-token: 'your-application-token-for-pai-rest-server'
    email-configs: # email-notification will only be enabled when this field is not empty
      admin-receiver: addr-of-admin-receiver@example.com
      smtp-host: smtp.office365.com
      smtp-port: 587
      smtp-from: alert-sender@example.com
      smtp-auth-username: alert-sender@example.com
      smtp-auth-password: password-for-alert-sender
  customized-routes: # routes are the matching rules between alerts and receivers
    routes:
    - receiver: pai-email-admin-user-and-stop-job
      match:
        alertname: PAIJobGpuPercentLowerThan0_3For1h
  customized-receivers: # receivers are combination of several actions
  - name: "pai-email-admin-user-and-stop-job"
    actions: 
      # the email template for `email-admin` and `email-user `can be chosen from ['general-template', 'kill-low-efficiency-job-alert']
      # if no template specified, 'general-template' will be used.
      email-admin:
      email-user:  
        template: 'kill-low-efficiency-job-alert'
      stop-jobs: # no parameters required for stop-jobs action
      tag-jobs:
        tags: 
        - 'stopped-by-alert-manager'

```

We have provided so far these following actions: 

  - `email-admin`: Send emails to the assigned admin.
  - `email-user`: Send emails to the owners of jobs. Currently, this action uses the same email template as `email-admin`.
  - `stop-jobs`: Stop jobs by calling OpenPAI REST API. **Be careful about this action because it stops jobs without notifying related users.**
  - `tag-jobs`: Add a tag to jobs by calling OpenPAI REST API.
  - `cordon-nodes`: Call Kubernetes API to cordon the corresponding nodes.

But before you use them, you have to add proper configuration in the `alert-handler` field. For example, `email-admin` needs you to set up an SMTP account to send the email and an admin email address to receive the email. Also, the `tag-jobs` and `stop-jobs` action calls OpenPAI REST API, so you should set a rest server token for them. To get the token, you should go to your profile page (in the top-right corner on Webporal, click `View my profile`), and use `Create application token` to create one. Generally speaking, there are two parts of the configuration in the `alert-handler` field. One is `email-configs`. The other is `pai-bearer-token`. The requirements for different actions are shown in the following table:

|              | email-configs | pai-bearer-token |
| :-----------:| :-----------: | :--------------: |
| cordon-nodes | -             | -                |
| email-admin  | required      | -                |
| email-user   | required      | required         |
| stop-jobs    | -             | required         |
| tag-jobs     | -             | required         |

In addition, some actions may depend on certain fields in the `labels` of alert instances. The labels of the `alert instance` are generated based on the expression in the alert rule. For example, the expression of the `PAIJobGpuPercentLowerThan0_3For1h` alert we mentioned in previous section is `avg(task_gpu_percent{virtual_cluster=~"default"}) by (job_name) < 0.3`. This expression returns a list, the element in which contains the `job_name` field. So there will be also a `job_name` field in the labels of the alert instance. `stop-jobs` action depends on the `job_name` field, and it will stop the corresponding job based on it. To inspect the labels of an alert, you can visit `http(s)://<your master IP>/prometheus/alerts`. If the alert is firing, you can see its labels on this page. For the depended fields of each pre-defined action, please refer to the following table:

|              | depended on label field |
| :-----------:| :------------------: |
| cordon-nodes | node_name            |
| email-admin  | -                    | 
| email-user   | -                    |
| stop-jobs    | job_name             |
| tag-jobs     | job_name             |


The matching rules between alerts and actions are defined using `receivers` and `routes`.
A `receiver` is simply a group of actions, a `route` matches the alerts to a specific `receiver`. 

With the default configuration, all the alerts will match the default alert receiver which triggers only `email-admin` action (But if you don't set the email configuration, the action won't work).
You can add new receivers with related matching rules to assign actions to alerts in the `alert-manager` field in [`service-configuration.yml`](./basic-management-operations.md#pai-service-management-and-paictl).


For example :

``` yaml
alert-manager:
  ......
  customized-routes: # routes are the matching rules between alerts and receivers
    routes:
    - receiver: pai-email-admin-user-and-stop-job
      match:
        alertname: PAIJobGpuPercentLowerThan0_3For1h
  customized-receivers: # receivers are combination of several actions
  - name: "pai-email-admin-user-and-stop-job"
    actions: 
      # the email template for `email-admin` and `email-user `can be chosen from ['general-template', 'kill-low-efficiency-job-alert']
      # if no template specified, 'general-template' will be used.
      email-admin:
      email-user:  
        template: 'kill-low-efficiency-job-alert'
      stop-jobs: # no parameters required for stop-jobs action
      tag-jobs:
        tags: 
        - 'stopped-by-alert-manager'
  ......
```

Here we define:

- a receiver `pai-email-admin-user-and-stop-job`, which contains the actions `email-admin`, `email-user`, `stop-jobs` and `tag-jobs`
- a route, which matches the alert `pai-email-admin-user-and-stop-job` to the receiver `pai-email-admin-user-and-stop-job`.

As a consequence, when the alert `PAIJobGpuPercentLowerThan0_3For1h` is fired, all these 4 actions will be triggered.

For `routes` definition, we adopt the syntax of [Prometheus Alertmanager](https://prometheus.io/docs/alerting/latest/configuration/).
For `receivers` definition, you can simply:

- name the receiver in `name` field;
- list the actions to use in `actions` and fill corresponding parameters for the actions:
  - `email-admin`: 
    - template: Optional, can be choose from ['general-template', 'kill-low-efficiency-job-alert'], by default 'general-template'.
  - `email-user`: 
    - template: Optional, can be choose from ['general-template', 'kill-low-efficiency-job-alert'], by default 'general-template'.
  - `cordon-nodes`: No parameters required
  - `stop-jobs`: No parameters required
  - `tag-jobs`:
    - tags: required, list of tags

You can also add customized email templates by adding a template folder in `pai/src/alert-manager/deploy/alert-templates`. 
Two files need to be present: one email body template file named `html.ejs` and one email subject template file named `subject.ejs`.
The folder name will be automatically passed as the template name.

Remember to push service config to the cluster and restart the `alert-manager` service after your modification with the following commands in the dev-box container:

```bash
./paictl.py service stop -n alert-manager
./paictl.py config push -p /cluster-configuration -m service
./paictl.py service start -n alert-manager
```
For OpenPAI service management, please refer to [here](./basic-management-operations.md#pai-service-management-and-paictl).

### How to Add Customized Actions

If you want to add new customized actions, follow these steps:

####  Realize the action in 'alert-handler'.
We provide `alert-handler` as a lightweight `express` application, where you can add customized APIs easily.

For example, the `stop-jobs` action is realized by calling the `localhost:9095/alert-handler/stop-jobs` API through `webhook`,
the request is then forward to the OpenPAI Rest Server to stop the job.
You can add new APIs in `alert-handler` and adapt the request to realize the required action.

The source code of `alert-handler` is available [here](https://github.com/microsoft/pai/blob/master/src/alert-manager/src/alert-handler).

#### Check the dependencies of the action

As stated before, to make an action available, administrators need to provide the necessary configurations.
Check this [folder](https://github.com/microsoft/pai/tree/master/src/alert-manager/config) and define the dependencies' rules for your customized actions.

#### Render the action to webhook configurations

When customized receivers are defined in `service-configuration.yml`,
the `actions` will then be rendered as webhook_configs [here](https://github.com/microsoft/pai/blob/master/src/alert-manager/deploy/alert-manager-configmap.yaml.template).

The actions we provide, `email-admin`, `email-user`, `stop-jobs`, `tag-jobs`, and `cordon-nodes`, can be called within `alert-manager` by sending POST requests to `alert-handler`:

- `localhost:{your_alert_handler_port}/alert-handler/send-email-to-admin`
- `localhost:{your_alert_handler_port}/alert-handler/send-email-to-user`
- `localhost:{your_alert_handler_port}/alert-handler/stop-jobs`
- `localhost:{your_alert_handler_port}/alert-handler/tag-jobs/:tag`
- `localhost:{your_alert_handler_port}/alert-handler/cordon-nodes`

The request body will be automatically filled by `alert-manager` with `webhook`
and `alert-handler` will adapt the requests to various actions.

Please define how to render your customized action to the `alert-handler` API request
[here](https://github.com/microsoft/pai/blob/master/src/alert-manager/src/alert-handler)

Remember to re-build and push the docker image, and restart the `alert-manager` service after your modification with the following commands in the dev-box container:

```bash
./build/pai_build.py build -c /cluster-configuration/ -s alert-manager
./build/pai_build.py push -c /cluster-configuration/ -i alert-handler
./paictl.py service stop -n alert-manager
./paictl.py config push -p /cluster-configuration -m service
./paictl.py service start -n alert-manager
```
