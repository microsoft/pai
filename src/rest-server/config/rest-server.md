# REST server section parser

- [Default Configuration](#Default-configuration-)
- [How to Configure](#How-to-configure-rest-server-section-in-service-configurationyaml-)
- [Generated Configuration](#Generated-configuration-)
- [Data Table](#Table-)
- [Notice](#Notice-)

## Default configuration

[rest-server default configuration](rest-server.yaml)

## How to configure rest-server section in service-configuration.yaml

There are 2 mandatory config fields in rest-server section: `default-pai-admin-username` and `default-pai-admin-password`,
other config fields are optional, includes:

- `server-port: 9186` The port REST server service will listen
- `jwt-secret: pai-secret` The secret key of JSON web token
- `jwt-expire-time` The expire time for a signed jwt token.
- `debugging-reservation-seconds: 604800` The seconds to reserved a job container to debug.

## Generated Configuration

After parsing, if you configured the rest-server the model will be like:

```yaml
rest-server:
  uri: http://rest-server-host:9186/
  server-port: 9186
  jwt-secret: pai-secret
  jwt-expire-time: "7d"
  default-pai-admin-username: pai-admin
  default-pai-admin-password: pai-admin-password
  schedule-port-start: 15000
  schedule-port-end: 40000
```

## Table

| Data in Configuration File             | Data in Cluster Object Model                     | Data in Jinja2 Template                                  | Data type |
|----------------------------------------|--------------------------------------------------|----------------------------------------------------------|-----------|
| rest-server.uri                        | com["rest-server"]["uri"]                        | cluster_cfg["rest-server"]["uri"]                        | URL       |
| rest-server.server-port                | com["rest-server"]["server-port"]                | cluster_cfg["rest-server"]["server-port"]                | Int       |
| rest-server.jwt-secret                 | com["rest-server"]["jwt-secret"]                 | cluster_cfg["rest-server"]["jwt-secret"]                 | String    |
| rest-server.jwt-expire-time            | com["rest-server"]["jwt-expire-time"]            | cluster_cfg["rest-server"]["jwt-expire-time"]            | String    |
| rest-server.default-pai-admin-username | com["rest-server"]["default-pai-admin-username"] | cluster_cfg["rest-server"]["default-pai-admin-username"] | String    |
| rest-server.default-pai-admin-password | com["rest-server"]["default-pai-admin-password"] | cluster_cfg["rest-server"]["default-pai-admin-password"] | String    |
| schedule-port-start                    | com["rest-server"]["schedule-port-start"]        | cluster_cfg["rest-server"]["schedule-port-start"]        | Int       |
| schedule-port-end                      | com["rest-server"]["schedule-port-end"]          | cluster_cfg["rest-server"]["schedule-port-end"]          | Int       |

## Notice
For config `schedule-port-start` and `schedule-port-end`. Change these config will cause rest server return incorrect port number for running job and finished job.
For the job which submitted after the config changes, the port number will be reported correctly.

To change the config, you need to change `host_daemon_port_start` and `host_daemon_port_end` in `contrib/kubespray/example/config.yml `correspondingly to avoid port overlap.
The default value for `host_daemon_port_start` and `host_daemon_port_end` is 40000 and 65535 includes 40000 and 65535. The default value for `schedule-port-start` and `schedule-port-end` is 15000 and 40000, includes 15000, not includes 40000.