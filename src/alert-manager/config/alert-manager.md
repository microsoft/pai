## Alerter-Manager section parser

* [Default Configuration](#D_Config)
* [How to Configure](#HT_Config)
* [Generated Configuration](#G_Config)

#### Default configuration <a name="D_Config"></a>

[alert-manager default configuration](alert-manager.yaml)

#### How to configure cluster section in service-configuration.yaml <a name="HT_Config"></a>

To configure alert-manager to send out alert emails and kill low-gpu-utilization jobs, you should configure alert manager in your `service-configuration.yaml` like following:

``` yaml
alert-manager:
  port: 9093 # optional, do not change this if you do not want to change the port alert-manager is listening on
  email_configs: # email-notification will only be enabled when this field is not empty
    receiver: your_addr@example.com
    smtp_url: smtp.office365.com:587
    smtp_from: alert_sender@example.com
    smtp_auth_username: alert_sender@example.com
    smtp_auth_password: password_for_alert_sender
  webhook_configs: # webhook-actions will only be enabled when  this field is not empty
    port: 9095 # optional, do not change this if you do not want to change the port alert-handler is listening on
    pai_bearer_token: 'your_application_token_for_pai_rest_server'
```

`email-notification` and `webhook-actions` will only be enabled when necessary information are configured. 
The port configurations are optional. All other config is mandatory. 
If `webhook_configs` is not configured, the `alert-handler` container will not start.

In addition, if you deployed pai behind firewall, you should configure alert-manager with `use-pylon: True` , to make url from alert email public available.

Also you can control the interval of sending same alert email if problem unsolved, the default interval is 24h, you can shorten it to 30m, by adding `repeat-interval: 30m` undert alert-manager config.

#### Generated Configuration <a name="G_Config"></a>

After parsing, if you configured `email_configs` and `webhook_configs`, the model will be like:

``` yaml
alert-manager: 
  port: 9093
  email-configured: True
  email_configs:
    receiver: your_addr@example.com
    smtp_url: smtp.office365.com:587
    smtp_from: alert_sender@example.com
    smtp_auth_username: alert_sender@example.com
    smtp_auth_password: password_for_alert_sender
  webhook-configured: True
  webhook_configs:
    port: 9095
    pai_bearer_token: 'your_application_token_for_pai_rest_server'
  host: master_ip
  url: "http://master_ip:9093"
  use-pylon: False
  repeat-interval: 24h
```

if you didn't configured `email_configs` and `webhook_configs`, it will be like:

``` yaml
alert-manager:
  port: 9093
  email-configured: False
  webhook-configured: False
  host: master_ip
  url: "http://master_ip:9093"
  use-pylon: False
  repeat-interval: 24h
```
