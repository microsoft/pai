## Alerter-Manager section parser

* [Default Configuration](#D_Config)
* [How to Configure](#HT_Config)
* [Generated Configuration](#G_Config)

#### Default configuration <a name="D_Config"></a>

[alert-manager default configuration](alert-manager.yaml)

#### How to configure cluster section in service-configuration.yaml <a name="HT_Config"></a>

So far, we have provided `cordon-nodes`, `email-admin`, `email-user`, `stop-job` and `tag-job` actions in `alert-handler`.
To make all these actions available, 
you should configure `alert-manager` in your `service-configuration.yaml` like following:

``` yaml
alert-manager:
  port: 9093 # optional, do not change this if you do not want to change the port alert-manager is listening on
  alert-handler: # alert-handler will only be enabled when this field is not empty
    port: 9095 # optional, do not change this if you do not want to change the port alert-handler is listening on
    pai-bearer-token: 'your-application-token-for-pai-rest-server'
    email-configs: # email-notification will only be enabled when this field is not empty
      admin-receiver: addr-of-admin-receiver@example.com
      smtp-host: smtp.office365.com
      smtp-port: 587
      smtp-from: alert-sender@example.com
      smtp-auth-username: alert-sender@example.com
      smtp-auth-password: password-for-alert-sender
```

In the configuration above, `email-configs` is necessary for `email-admin` and `email-user` actions,
`pai-bearer-token` is necessary for `email-user`, `stop-jobs` and `tag-jobs` actions.
This can be summrized in the following table:

|              | email-configs | pai-bearer-token |
| :-----------:| :-----------: | :--------------: |
| cordon-nodes | False         | False            |
| email-admin  | True          | False            |
| email-user   | True          | True             |
| stop-jobs    | False         | True             |
| tag-jobs     | False         | True             |

If `alert-handler` is not configured, the `alert-handler` container will not start.

In addition, if you deployed pai behind firewall, you should configure alert-manager with `use-pylon: True` , to make url from alert email public available.

Also you can control the interval of sending same alert email if problem unsolved, the default interval is 24h, you can shorten it to 30m, by adding `repeat-interval: 30m` undert alert-manager config.

#### Generated Configuration <a name="G_Config"></a>

After parsing, if you properly configured `email-configs` and `pai-bearer-token`, the configuration generated will be like:

``` yaml
alert-manager: 
  port: 9093
  actions-available:
  - webportal-notification
  - cordon-nodes
  - email-admin
  - email-user
  - stop-jobs
  - tag-jobs
  alert-handler:
    log-level: info
    port: 9095
    configured: True
    pai-bearer-token: 'your-application-token-for-pai-rest-server'
    email-configs: # email-notification will only be enabled when this field is not empty
      admin-receiver: addr-of-admin-receiver@example.com
      smtp-host: smtp.office365.com
      smtp-port: 587
      smtp-from: alert-sender@example.com
      smtp-auth-username: alert-sender@example.com
      smtp-auth-password: password-for-alert-sender
  host: master_ip
  url: "http://master_ip:9093"
  use-pylon: False
  repeat-interval: 24h
```

if you didn't configured `alert-handler`, it will be like:

``` yaml
alert-manager:
  port: 9093
  actions-available:
  - webportal-notification
  - cordon-nodes
  alert-handler:
    log-level: info
    port: 9095
    configured: False
  host: master_ip
  url: "http://master_ip:9093"
  use-pylon: False
  repeat-interval: 24h
```

Similarly, we can get the generated configuration if `alert-handler` is partially configured.
