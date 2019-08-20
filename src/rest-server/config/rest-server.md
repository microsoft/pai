# REST server section parser

- [Default Configuration](#D_Config)
- [How to Configure](#HT_Config)
- [Generated Configuraiton](#G_Config)
- [Data Table](#T_config)

## Default configuration <a name="D_Config"></a>

[rest-server default configuration](rest-server.yaml)

## How to configure rest-server section in service-configuraiton.yaml <a name="HT_Config"></a>

There are 2 mandatory config fields in rest-server section: `default-pai-admin-username` and `default-pai-admin-password`,
other config fields are optional, includes:

- `server-port: 9186` The port REST server service will listen
- `launcher-type: yarn` The launcher type of REST server, should be "yarn" or "k8s". Default is "yarn"
- `jwt-secret: pai-secret` The secret key of JSON web token
- `jwt-expire-time` The expire time for a signed jwt token.
- `github-owner: Microsoft` The marketplace repo owner in GitHub
- `github-repository: pai` The marketplace repo name
- `github-path: marketplace` The marketpalce path in the repo
- `debugging-reservation-seconds: 604800` The seconds to reserved a job container to debug.

## Generated Configuration <a name="G_Config"></a>

After parsing, if you configured the rest-server the model will be like:

```yaml
rest-server:
    uri: http://rest-server-host:9186/
    server-port: 9186
    launcher-type: yarn
    jwt-secret: pai-secret
    jwt-expire-time: '7d'
    default-pai-admin-username: pai-admin
    default-pai-admin-password: pai-admin-password
    github-owner: Microsoft
    github-repository: pai
    github-path: marketplace
    debugging-reservation-seconds: 604800
```

## Table <a name="T_Config"></a>

<table>
<tr>
    <td>Data in Configuration File</td>
    <td>Data in Cluster Object Model</td>
    <td>Data in Jinja2 Template</td>
    <td>Data type</td>
</tr>
<tr>
    <td>rest-server.uri</td>
    <td>com["rest-server"]["uri"]</td>
    <td>cluster_cfg["rest-server"]["uri"]</td>
    <td>URL</td>
</tr>
<tr>
    <td>rest-server.server-port</td>
    <td>com["rest-server"]["server-port"]</td>
    <td>cluster_cfg["rest-server"]["server-port"]</td>
    <td>Int</td>
</tr>
<tr>
    <td>rest-server.launcher-type</td>
    <td>com["rest-server"]["launcher-type"]</td>
    <td>cluster_cfg["rest-server"]["launcher-type"]</td>
    <td>String</td>
</tr>
<tr>
    <td>rest-server.jwt-secret</td>
    <td>com["rest-server"]["jwt-secret"]</td>
    <td>cluster_cfg["rest-server"]["jwt-secret"]</td>
    <td>String</td>
</tr>
<tr>
    <td>rest-server.jwt-expire-time</td>
    <td>com["rest-server"]["jwt-expire-time"]</td>
    <td>cluster_cfg["rest-server"]["jwt-expire-time"]</td>
    <td>String</td>
</tr>
<tr>
    <td>rest-server.default-pai-admin-username</td>
    <td>com["rest-server"]["default-pai-admin-username"]</td>
    <td>cluster_cfg["rest-server"]["default-pai-admin-username"]</td>
    <td>String</td>
</tr>
<tr>
    <td>rest-server.default-pai-admin-password</td>
    <td>com["rest-server"]["default-pai-admin-password"]</td>
    <td>cluster_cfg["rest-server"]["default-pai-admin-password"]</td>
    <td>String</td>
</tr>
<tr>
    <td>rest-server.github-owner</td>
    <td>com["rest-server"]["github-owner"]</td>
    <td>cluster_cfg["rest-server"]["github-owner"]</td>
    <td>String</td>
</tr>
<tr>
    <td>rest-server.github-repository</td>
    <td>com["rest-server"]["github-repository"]</td>
    <td>cluster_cfg["rest-server"]["github-repository"]</td>
    <td>String</td>
</tr>
<tr>
    <td>rest-server.github-path</td>
    <td>com["rest-server"]["github-path"]</td>
    <td>cluster_cfg["rest-server"]["github-path"]</td>
    <td>String</td>
</tr>
<tr>
    <td>rest-server.etcd-uris</td>
    <td>com["rest-server"]["etcd-uris"]</td>
    <td>cluster_cfg["rest-server"]["etcd-uris"]</td>
    <td>String</td>
</tr>
<tr>
    <td>rest-server.debugging-reservation-seconds</td>
    <td>com["rest-server"]["debugging-reservation-seconds"]</td>
    <td>cluster_cfg["rest-server"]["debugging-reservation-seconds"]</td>
    <td>String</td>
</tr>
</table>
