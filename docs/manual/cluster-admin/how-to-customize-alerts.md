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

OpenPAI uses `alert-manager` service for alert handling. We provided three types of actions: 

* webportal-notification: Show alerts on the home page of webportal.
* email-notification: Send email to the assigned receiver.
* webhook-actions: Send alert via a POST request and then adapt the request to customized actions. We now support these actions:
    - stop-job: Stop jobs by adapting the POST request to the corresponding OpenPAI REST API.

`webportal-notification` is always enabled, all the alerts will be shown on the webportal.

To enable `email-notification` and `webhook-actions`, administrators need to configure necessary information in the `alert-manager` field of `service-configuration.yml`: 

```yaml
alert-manager:
  port: 9093 # optional, do not change this if you do not want to change the port alert-manager is listening on
  email-notification: # email-notification will only be enabled when this field is not empty
    receiver: your_addr@example.com
    smtp_url: smtp.office365.com:587
    smtp_from: alert_sender@example.com
    smtp_auth_username: alert_sender@example.com
    smtp_auth_password: password_for_alert_sender
  webhook-actions: # webhook-actions will only be enabled when  this field is not empty
    port: 9095 # optional, do not change this if you do not want to change the port alert-handler is listening on
    bearer_token: 'your_application_token_for_rest_server'
```

### How to Match Alerts and Actions

The matching rules of alerts and actions are defined in [alert-configmap.yaml.template](https://github.com/microsoft/pai/blob/master/src/alert-manager/deploy/alert-configmap.yaml.template):

``` yaml
kind: ConfigMap
apiVersion: v1
metadata:
  name: alertmanager
data:
  config.yml: |-
{% set email_notification = cluster_cfg["alert-manager"]["email-notification"] %}
{% set webhook_actions = cluster_cfg["alert-manager"]["webhook-actions"] %}
    global:
      resolve_timeout: 5m
{% if cluster_cfg["alert-manager"]["email-notification-configured"] %}
      smtp_smarthost: {{ email_notification["smtp_url"] }}
      smtp_from: {{ email_notification["smtp_from"] }}
      smtp_auth_username: {{ email_notification["smtp_auth_username"] }}
      smtp_auth_password: {{ email_notification["smtp_auth_password"] }}
{% endif %}
    
    templates:
    - "/etc/alertmanager/template/*.tmpl"

    route:
      receiver: pai-email
      group_wait: 30s
      group_interval: 5m
      repeat_interval: {{ cluster_cfg["alert-manager"]["repeat-interval"] }}
      group_by: [alertname, alertstate]
      routes:
      - receiver: pai-email-and-stop-job
        match: 
          alertname: PAIJobGpuPercentLowerThan0_3For1h
    
    receivers:
    - name: "pai-email"
{% if cluster_cfg["alert-manager"]["email-notification-configured"] %}
      email_configs:
        - to: {{ email_notification["receiver"] }}
          send_resolved: true
          html: '{{ "{{" }} template "email.pai.html" . {{ "}}" }}'
          headers:
            subject: '{{ cluster_cfg["cluster"]["common"]["cluster-id"] }}: {{ "{{" }} template "__subject" . {{ "}}" }}'
{% endif %}
    - name: "pai-email-and-stop-job"
{% if cluster_cfg["alert-manager"]["email-notification-configured"] %}
      email_configs:
        - to: {{ email_notification["receiver"] }}
          send_resolved: true
          html: '{{ "{{" }} template "email.pai.html" . {{ "}}" }}'
          headers:
            subject: '{{ cluster_cfg["cluster"]["common"]["cluster-id"] }}: {{ "{{" }} template "__subject" . {{ "}}" }}'
{% endif %}
{% if cluster_cfg["alert-manager"]["webhook-actions-configured"] %}
      webhook_configs:
        - url: 'http://localhost:{{ webhook_actions["port"] }}/alert-handler/stop-job'
          http_config:
            bearer_token: {{ webhook_actions["bearer_token"] }}
{% endif %}

```

`cluster_cfg["alert-manager"]["email-notification"]` and `cluster_cfg["alert-manager"]["webhook-actions-configured"]`
will be `True` necessary information in the `alert-manager` field of `service-configuration.yml` is configured.

In this example, as defined in the `route` filed, `PAIJobGpuPercentLowerThan0_3For1h` alert will be handled by `pai-alert-handler` receiver. Under `pai-alert-handler` receiver, both email and webhook are configured, which means that both email and stop-job action will be triggered when the `PAIJobGpuPercentLowerThan0_3For1h` alert is fired.

The other alerts will be handled by `pai-alert` receiver, which will trigger only the email action.

You can customize `email_config` and `webhook_config` in the `alert-manager` field of `services-configuration.yaml`. 
You can also add new receivers with related matching rules to assign different actions to alerts.

Restart the `alert-manager` service after your modification.

For alert & action matching rules syntax, please refer to [link](https://prometheus.io/docs/alerting/latest/configuration/).

For OpenPAI service management, please refer to [link](https://github.com/microsoft/pai/blob/master/docs/manual/cluster-admin/basic-management-operations.md).

## How to Customize Alerts

All the alert rules are defined in [this folder](https://github.com/microsoft/pai/blob/master/src/prometheus/deploy/alerting).
If you want to change the default values of some fields of these rules, modify the corresponding `.rules` files.
You can also add new rules by using various system metrics, feel free to add a `.rules` file in the folder if you need it.
You can explore the metrics at `your_master_ip/prometheus/graph`.

Restart the `prometheus` service after your modification. 

For alerting rules syntax, please refer to [link](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/).

## How to Add New Actions

If you want to add new customized actions, you are encouraged to realize that through `alert-handler`.
We provide `alert-handler` as a lightweight `express` application, where you can add customized API easily.

For example, the stop-job action is realized by calling the `localhost:9095/alert-handler/stop-job` API through webhook, the request is then forward to the OpenPAI Rest Server to stop job. You can add new APIs in `alert-handler` and adapt the request to other Rest Servers.

The source code of `alert-handler` is available [here](https://github.com/microsoft/pai/blob/master/src/alert-manager/src).
Remember to re-build and push the docker image, and restart the `alert-manager` service after your modification.
