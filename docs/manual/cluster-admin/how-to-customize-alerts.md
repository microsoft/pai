# How to Customize Alerts

OpenPai supports the customization of alert rules and handling actions.
The alert rules are defined in `prometheus` Service and the handling actions are managed by `alert-manager` Service.

## Change Predefined Alert Rules

OpenPAI uses `Prometheus` to monitor system metrics.
Lots of predefined alert rules are available. By defining rules on virtual_clusters, GPU utilization, etc, we realize various alerts.
If OpenPAI is already deployed, you can visit `your_master_ip/prometheus/alerts` to see the details of alerts, including their definition and status.

For example, `PAIJobLowGpuPercent` alert rule is by default configured as :

``` yaml
alert: PaiJobLowGpuPercent
expr: avg(task_gpu_percent{virtual_cluster=~"default"}) BY (job_name) < 0.3
for: 1h
```

It means that the job on virtual cluster `default` with task level average GPU percent lower than `30%` for more than `1 hour` will fire the alert `PAIJobLowGpuPercent` .

If you want to change the default values of some fields of these rules, modify the corresponding `.rules` files [here](https://github.com/microsoft/pai/blob/master/src/prometheus/deploy/alerting). You can also add new rule files in this folder. Restart `prometheus` service after your modification. 

For alerting rules syntax, please refer to [link](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/).

For OpenPAI service management, please refer to [link](https://github.com/microsoft/pai/blob/master/docs/manual/cluster-admin/basic-management-operations.md).

## Change Default Actions for Alerts

OpenPAI uses Alert-manager for alerting handling. Two types of actions are provided: 

* Send email to administrators
* Stop jobs by REST API

The actions for alerts are defined in [alert-configmap](https://github.com/microsoft/pai/blob/master/src/alert-manager/deploy/alert-configmap.yaml.template)

For example, `PAIJobLowGpuPercent` alert will be handled by `pai-alert-handler` receiver, both email and stop-job action will be triggered when the `PAIJobLowGpuPercent` alert is fired.

``` yaml
receivers:
    - name: "pai-alert-handler"
      email_configs:
        - to: {{ alert_info["receiver"] }}
          send_resolved: true
          html: '{{ "{{" }} template "email.pai.html" . {{ "}}" }}'
          headers:
            subject: '{{ cluster_cfg["cluster"]["common"]["cluster-id"] }}: {{ "{{" }} template "__subject" . {{ "}}" }}'
      webhook_configs:
        - url: 'http://localhost:{{ alert_info["alert-handler"]["port"] }}/alert-handler'
          http_config:
            bearer_token: {{ alert_info["alert-handler"]["bearer_token"] }}
```

You can customize `email_config` and `webhook_config` in the `alert-manager` field of `services-configuration.yaml` , the `alert-configmap` will be rendered automatically when you restart the service.

## Add New Customized Actions

If you want to add new customized actions, you are encouraged to realize that through webhook.
We provide `alert-handler` as a lightweight `express` application, which you can add customized API easily.
For example, the stop-job action is realized by calling the `localhost:9095/alert-handler/stop-job` API.

The source code of `alert-handler` is available [here](https://github.com/microsoft/pai/blob/master/src/alert-manager/src).
Remember to re-build and push the docker image, and restart `alert-manager` service after you modify the source code.
