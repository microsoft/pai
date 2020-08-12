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

OpenPAI uses `alert-manager` service for alert handling. So far, we have provided three types of actions: 

* webportal-alert: Show alerts on the home page of webportal.
* email-alert: Send email to the assigned receiver.
* webhook-alert: Send alert via a POST request, we now support stopping jobs by adapting the POST request to the corresponding REST API of OpenPAI.

These actions can be configured in the `alert-manager` field of `service-configuration.yml`: 

```yaml
alert-manager:
  webprotal-alert: 
    enable: True
  email-alert:
    enable: False
    receiver: your_addr@example.com
    smtp_url: smtp.office365.com:587
    smtp_from: alert_sender@example.com
    smtp_auth_username: alert_sender@example.com
    smtp_auth_password: password_for_alert_sender
    port: 9093 # optional, do not change this if you do not want to change the port alert-manager is listening on
  webhook-alert:
    enable: False
    port: 9095 # optional, do not change this if you do not want to change the port alert-handler is listening on
    bearer_token: 'your_application_token_for_rest_server'
```

By default, `webportal-alert` is enabled, `email-alert` and `webhook-alert` are disabled.

### How to Match Alerts and Actions

The matching rules of alerts and actions are defined in [alert-configmap.yaml.template](https://github.com/microsoft/pai/blob/master/src/alert-manager/deploy/alert-configmap.yaml.template).


If you enable `email-alert` and `webhook-alert` in `service-configuration.yml`, after rendering, this file will be like:

``` yaml
kind: ConfigMap
apiVersion: v1
metadata:
  name: alertmanager
data:
  config.yml: |-
    global:
      resolve_timeout: 5m
      smtp_smarthost: smtp.office365.com:587
      smtp_from: alert_sender@example.com
      smtp_auth_username: alert_sender@example.com
      smtp_auth_password: password_for_alert_sender
      receiver: your_addr@example.com
    
    templates:
    - "/etc/alertmanager/template/*.tmpl"

    route:
      receiver: pai-alert
      group_wait: 30s
      group_interval: 5m
      repeat_interval: 24h
      group_by: [alertname, alertstate]
      routes:
      - receiver: 'pai-alert-handler'
        match: 
          alertname: PAIJobGpuPercentLowerThan0_3For1h
    
    receivers:
    - name: "pai-alert"
      email_configs:
        - to: your_addr@example.com
          send_resolved: true
          html: '{{ template "email.pai.html" . }}'
          headers:
            subject: 'pai: {{ template "__subject" . }}'
    - name: "pai-alert-handler"
      email_configs:
        - to: your_addr@example.com
          send_resolved: true
          html: '{{ template "email.pai.html" . }}'
          headers:
            subject: 'pai: {{ template "__subject" . }}'
      webhook_configs:
        - url: 'http://localhost:9095/alert-handler/stop-job'
          http_config:
            bearer_token: your_bearer_token
```

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
You can also add new rules by using various system metrics, feel free to add a `.rules` file in the folder if you need it. You can explore the metrics at `your_master_ip/prometheus/graph`.

Restart the `prometheus` service after your modification. 

For alerting rules syntax, please refer to [link](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/).

## How to Add New Actions

If you want to add new customized actions, you are encouraged to realize that through `alert-handler`.
We provide `alert-handler` as a lightweight `express` application, where you can add customized API easily.

For example, the stop-job action is realized by calling the `localhost:9095/alert-handler/stop-job` API through webhook, the request is then forward to the OpenPAI Rest Server to stop job. You can add new APIs in `alert-handler` and adapt the request to other Rest Servers.

The source code of `alert-handler` is available [here](https://github.com/microsoft/pai/blob/master/src/alert-manager/src).
Remember to re-build and push the docker image, and restart the `alert-manager` service after your modification.
