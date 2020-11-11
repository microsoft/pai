## Log-manager section parser

- [Default configuration](#default-configuration)
- [How to configure cluster section in service-configuration.yaml](#how-to-configure-cluster-section-in-service-configurationyaml)
- [Generated Configuration](#generated-configuration)
- [Table](#table)

#### Default configuration

[log-manager default configuration](log-manager.yaml)

#### How to configure cluster section in service-configuration.yaml

All configurations in this section is optional. If you want to customized these value, you can configure it in service-configuration.yaml.

For example, if you want to use different port than the default 9103, add following to your service-configuration.yaml as following:
```yaml
log-manager:
  port: new-value
```

#### Generated Configuration

Generated configuration means the object model after parsing. The parsed data will be presented by a yaml format.
```yaml
log-manager:
  port: 9103
  admin_name: admin
  admin_password: admin
  jwt_secret: "jwt_secret"
  token_expired_second: 120
```


#### Table

| Data in Configuration File        | Data in Cluster Object Model                | Data in Jinja2 Template                            | Data type |
|-----------------------------------|---------------------------------------------|----------------------------------------------------|-----------|
| log-manager.port                  | com["log-manager"]["port"]                  | cluster_cfg["log-manager"]["port"]                 | Int       |
| log-manager.admin_name            | com["log-manager"]["admin_name"]            | cluster_cfg["log-manager"]["admin_name"]           | String    |
| log-manager.admin_password        | com["log-manager"]["admin_password"]        | cluster_cfg["log-manager"]["admin_password"]       | String    |
| log-manager.jwt_secret            | com["log-manager"]["jwt_secret"]            | cluster_cfg["log-manager"]["jwt_secret"]           | String    |
| log-manager.token_expired_second  | com["log-manager"]["token_expired_second"]  | cluster_cfg["log-manager"]["token_expired_second"] | Int       |
