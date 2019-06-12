## Alerter-Manager section parser

- [Default Configuration](#D_Config)
- [How to Configure](#HT_Config)
- [Generated Configuraiton](#G_Config)

#### Default configuration <a name="D_Config"></a>

[alert-manager default configuration](alert-manager.yaml)

#### How to configure cluster section in service-configuraiton.yaml <a name="HT_Config"></a>

Port configurations in this section is optional which default to 9093. All other config is mandatory. If not receiver is configured, the alert manager will not start.

To configure alert-manager to send out alert email, you should configure alert manager with receiver in your service-configuration like following:
```yaml
alert-manager:
    receiver: your_addr@example.com
    smtp_url: smtp.office365.com:587
    smtp_from: alert_sender@example.com
    smtp_auth_username: alert_sender@example.com
    smtp_auth_password: password_for_alert_sender
    port: 9093 # this is optional, you should not write this if you do not want to change the port alert-manager is listening on
```

In addition, if you deployed pai behind firewall, you should configure alert-manager with `use-pylon: True`, to make url from alert email public available.

Also you can control the interval of sending same alert email if problem unsolved, the default interval is 24h, you can shorten it to 30m, by adding `repeat-interval: 30m` undert alert-manager config.

#### Generated Configuration <a name="G_Config"></a>

After parsing, if you configured the alert-manager the model will be like:
```yaml
alert-manager:
    receiver: your_addr@example.com
    smtp_url: smtp.office365.com:587
    smtp_from: alert_sender@example.com
    smtp_auth_username: alert_sender@example.com
    smtp_auth_password: password_for_alert_sender
    port: 9093
    configured: True
    host: master_ip
    url: "http://master_ip:9093"
    use-pylon: False
    repeat-interval: 24h
```

if you didn't configured alert-manager, it will be like:
```yaml
alert-manager:
    port: 9093
    configured: False
    host: master_ip
    url: "http://master_ip:9093"
    use-pylon: False
    repeat-interval: 24h
```
