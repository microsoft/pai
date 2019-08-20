# Webportal section parser

- [Default Configuration](#D_Config)
- [How to Configure](#HT_Config)
- [Generated Configuraiton](#G_Config)
- [Data Table](#T_config)

## Default configuration <a name="D_Config"></a>

[webportal default configuration](webportal.yaml)

## How to configure webportal section in service-configuraiton.yaml <a name="HT_Config"></a>

All configurations in this section is optional. If you want to customized these value, you can configure it in service-configuration.yaml.

For example, if you want to use different port than the default 9286, add following to your service-configuration.yaml as following:

```yaml
webportal:
    server-port: new-value
    log-type: yarn
```

About config the web portal plugin, see [PLUGINS.md](../../../docs/webportal/PLUGINS.md)

## Generated Configuration <a name="G_Config"></a>

After parsing, object model looks like:

```yaml
webportal:
    server-port: 9286
    log-type: yarn
    uri: "http://master_ip:9286"
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
    <td>webportal.server-port</td>
    <td>com["webportal"]["server-port"]</td>
    <td>cluster_cfg["webportal"]["server-port"]</td>
    <td>Int</td>
</tr>
<tr>
    <td>webportal.log-type</td>
    <td>com["webportal"]["log-type"]</td>
    <td>cluster_cfg["webportal"]["log-type"]</td>
    <td>String</td>
</tr>
<tr>
    <td>webportal.uri</td>
    <td>com["webportal"]["uri"]</td>
    <td>cluster_cfg["webportal"]["uri"]</td>
    <td>URL</td>
</tr>
</table>
